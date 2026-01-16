"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { formatPrice, formatDate } from "@/lib/utils";
import { Button, Input, Select, Card, CardHeader, CardTitle, CardContent, Alert, Badge, PhoneInput, KTPInput } from "@/components/ui";
import { ArrowLeft, Plus, Trash2, User, Calendar, MapPin, Users, Check } from "lucide-react";

interface Departure {
  id: string;
  departureDate: string;
  pricePerPerson: number | null;
  maxParticipants: number | null;
  _count: { bookings: number };
  groups: { id: string; groupNumber: number; price: number; maxParticipants: number; isBooked: boolean }[];
}

interface PackageData {
  id: string;
  title: string;
  slug: string;
  tripType: "OPEN_TRIP" | "PRIVATE_TRIP";
  location: string;
  duration: string;
  thumbnail: string | null;
  departures: Departure[];
}

interface ParticipantForm {
  id?: string;
  fullName: string;
  gender: string;
  birthDate: string;
  idNumber: string;
  phone: string;
  domicile: string;
  healthHistory: string;
  isNew: boolean;
}

interface SavedParticipant {
  id: string;
  fullName: string;
  gender: string;
  birthDate: string | null;
  idNumber: string | null;
  phone: string | null;
  domicile: string | null;
  healthHistory: string | null;
}

export default function NewBookingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  
  const packageSlug = searchParams.get("package");
  const preselectedDepartureId = searchParams.get("departure");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [packageData, setPackageData] = useState<PackageData | null>(null);
  const [savedParticipants, setSavedParticipants] = useState<SavedParticipant[]>([]);

  const [selectedDepartureId, setSelectedDepartureId] = useState(preselectedDepartureId || "");
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [participantCount, setParticipantCount] = useState(1);
  const [participants, setParticipants] = useState<ParticipantForm[]>([
    { fullName: "", gender: "MALE", birthDate: "", idNumber: "", phone: "", domicile: "", healthHistory: "", isNew: true }
  ]);
  const [notes, setNotes] = useState("");

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push(`/login?callbackUrl=/dashboard/bookings/new?package=${packageSlug}`);
    }
  }, [status, router, packageSlug]);

  // Fetch package data
  useEffect(() => {
    if (!packageSlug || status !== "authenticated") return;

    async function fetchData() {
      try {
        const [pkgRes, participantsRes] = await Promise.all([
          fetch(`/api/packages/${packageSlug}`),
          fetch("/api/participants")
        ]);

        if (!pkgRes.ok) throw new Error("Package not found");
        
        const pkgData = await pkgRes.json();
        setPackageData(pkgData.data);

        if (participantsRes.ok) {
          const partData = await participantsRes.json();
          setSavedParticipants(partData.data || []);
        }

        if (preselectedDepartureId) {
          setSelectedDepartureId(preselectedDepartureId);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [packageSlug, preselectedDepartureId, status]);

  // Get selected departure
  const selectedDeparture = packageData?.departures.find(d => d.id === selectedDepartureId);
  const isOpenTrip = packageData?.tripType === "OPEN_TRIP";
  const isPrivateTrip = packageData?.tripType === "PRIVATE_TRIP";

  // Get available groups for private trip
  const availableGroups = selectedDeparture?.groups.filter(g => !g.isBooked) || [];
  const selectedGroup = selectedDeparture?.groups.find(g => g.id === selectedGroupId);

  // Calculate total price
  const calculateTotal = () => {
    if (isOpenTrip && selectedDeparture?.pricePerPerson) {
      return Number(selectedDeparture.pricePerPerson) * participantCount;
    }
    if (isPrivateTrip && selectedGroup) {
      return Number(selectedGroup.price);
    }
    return 0;
  };

  // Handle participant count change for open trip
  const handleParticipantCountChange = (count: number) => {
    setParticipantCount(count);
    const currentCount = participants.length;
    
    if (count > currentCount) {
      const newParticipants = Array(count - currentCount).fill(null).map(() => ({
        fullName: "", gender: "MALE", birthDate: "", idNumber: "", phone: "", domicile: "", healthHistory: "", isNew: true
      }));
      setParticipants([...participants, ...newParticipants]);
    } else if (count < currentCount) {
      setParticipants(participants.slice(0, count));
    }
  };

  // Add participant
  const addParticipant = () => {
    setParticipants([...participants, {
      fullName: "", gender: "MALE", birthDate: "", idNumber: "", phone: "", domicile: "", healthHistory: "", isNew: true
    }]);
    if (isOpenTrip) setParticipantCount(participants.length + 1);
  };

  // Remove participant
  const removeParticipant = (index: number) => {
    if (participants.length <= 1) return;
    setParticipants(participants.filter((_, i) => i !== index));
    if (isOpenTrip) setParticipantCount(participants.length - 1);
  };

  // Use saved participant
  const useSavedParticipant = (index: number, savedId: string) => {
    const saved = savedParticipants.find(p => p.id === savedId);
    if (!saved) return;

    const updated = [...participants];
    updated[index] = {
      id: saved.id,
      fullName: saved.fullName,
      gender: saved.gender,
      birthDate: saved.birthDate ? saved.birthDate.split("T")[0] : "",
      idNumber: saved.idNumber || "",
      phone: saved.phone || "",
      domicile: saved.domicile || "",
      healthHistory: saved.healthHistory || "",
      isNew: false
    };
    setParticipants(updated);
  };

  // Update participant field
  const updateParticipant = (index: number, field: keyof ParticipantForm, value: string) => {
    const updated = [...participants];
    updated[index] = { ...updated[index], [field]: value, isNew: true, id: undefined };
    setParticipants(updated);
  };

  // Submit booking
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    // Validation
    if (!selectedDepartureId) {
      setError("Please select a departure date");
      setSubmitting(false);
      return;
    }

    if (isPrivateTrip && !selectedGroupId) {
      setError("Please select a group");
      setSubmitting(false);
      return;
    }

    const invalidParticipant = participants.find(p => !p.fullName.trim());
    if (invalidParticipant) {
      setError("Please fill in all participant names");
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packageId: packageData?.id,
          departureId: selectedDepartureId,
          departureGroupId: isPrivateTrip ? selectedGroupId : undefined,
          participantCount,
          participants: participants.map(p => ({
            id: p.isNew ? undefined : p.id,
            fullName: p.fullName,
            gender: p.gender,
            birthDate: p.birthDate || undefined,
            idNumber: p.idNumber || undefined,
            phone: p.phone || undefined,
            domicile: p.domicile || undefined,
            healthHistory: p.healthHistory || undefined,
          })),
          notes,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create booking");
      }

      const data = await res.json();
      setSuccess(`Booking created successfully! Your booking code is ${data.data.bookingCode}`);
      
      setTimeout(() => {
        router.push(`/dashboard/bookings/${data.data.id}`);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-100">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!packageData) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <h1 className="text-2xl font-bold text-slate-900 mb-4">Package Not Found</h1>
        <p className="text-slate-600 mb-6">The package you're trying to book doesn't exist.</p>
        <Link href="/packages"><Button>Browse Packages</Button></Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/packages/${packageData.slug}`} className="p-2 rounded-lg hover:bg-slate-100">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Book Your Trip</h1>
          <p className="text-slate-600">{packageData.title}</p>
        </div>
      </div>

      {error && <Alert variant="error">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Package Summary */}
        <Card variant="bordered">
          <CardContent className="flex gap-4">
            <div className="w-24 h-24 rounded-lg bg-slate-100 overflow-hidden shrink-0">
              {packageData.thumbnail ? (
                <img src={packageData.thumbnail} alt={packageData.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <MapPin className="w-8 h-8 text-slate-300" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant={isOpenTrip ? "info" : "warning"}>{isOpenTrip ? "Open Trip" : "Private Trip"}</Badge>
              </div>
              <h3 className="font-semibold text-slate-900">{packageData.title}</h3>
              <p className="text-sm text-slate-500 flex items-center gap-1"><MapPin className="w-4 h-4" />{packageData.location}</p>
              <p className="text-sm text-slate-500">{packageData.duration}</p>
            </div>
          </CardContent>
        </Card>

        {/* Select Departure */}
        <Card variant="bordered">
          <CardHeader><CardTitle className="flex items-center gap-2"><Calendar className="w-5 h-5" /> Select Departure Date</CardTitle></CardHeader>
          <CardContent>
            {packageData.departures.length > 0 ? (
              <div className="grid gap-3">
                {packageData.departures.map((dep) => {
                  const spotsLeft = isOpenTrip && dep.maxParticipants ? dep.maxParticipants - dep._count.bookings : null;
                  const isFull = isOpenTrip && spotsLeft !== null && spotsLeft <= 0;
                  const hasAvailableGroups = isPrivateTrip && dep.groups.some(g => !g.isBooked);

                  return (
                    <label
                      key={dep.id}
                      className={`flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedDepartureId === dep.id
                          ? "border-primary-500 bg-primary-50"
                          : isFull || (isPrivateTrip && !hasAvailableGroups)
                          ? "border-slate-200 bg-slate-50 opacity-50 cursor-not-allowed"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="departure"
                          value={dep.id}
                          checked={selectedDepartureId === dep.id}
                          onChange={(e) => {
                            setSelectedDepartureId(e.target.value);
                            setSelectedGroupId("");
                          }}
                          disabled={isFull || (isPrivateTrip && !hasAvailableGroups)}
                          className="w-4 h-4 text-primary-600"
                        />
                        <div>
                          <p className="font-medium text-slate-900">{formatDate(new Date(dep.departureDate))}</p>
                          {isOpenTrip && spotsLeft !== null && (
                            <p className={`text-sm ${spotsLeft <= 3 ? "text-amber-600" : "text-slate-500"}`}>
                              {isFull ? "Fully booked" : `${spotsLeft} spots left`}
                            </p>
                          )}
                          {isPrivateTrip && (
                            <p className="text-sm text-slate-500">
                              {dep.groups.filter(g => !g.isBooked).length} of {dep.groups.length} groups available
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        {isOpenTrip && dep.pricePerPerson && (
                          <p className="font-semibold text-primary-600">{formatPrice(Number(dep.pricePerPerson))}<span className="text-sm font-normal text-slate-500">/person</span></p>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            ) : (
              <p className="text-center text-slate-500 py-4">No departures available</p>
            )}
          </CardContent>
        </Card>

        {/* Select Group (Private Trip) */}
        {isPrivateTrip && selectedDeparture && (
          <Card variant="bordered">
            <CardHeader><CardTitle className="flex items-center gap-2"><Users className="w-5 h-5" /> Select Group</CardTitle></CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {selectedDeparture.groups.map((group) => (
                  <label
                    key={group.id}
                    className={`flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedGroupId === group.id
                        ? "border-primary-500 bg-primary-50"
                        : group.isBooked
                        ? "border-slate-200 bg-slate-50 opacity-50 cursor-not-allowed"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="group"
                        value={group.id}
                        checked={selectedGroupId === group.id}
                        onChange={(e) => setSelectedGroupId(e.target.value)}
                        disabled={group.isBooked}
                        className="w-4 h-4 text-primary-600"
                      />
                      <div>
                        <p className="font-medium text-slate-900">Group {group.groupNumber}</p>
                        <p className="text-sm text-slate-500">Max {group.maxParticipants} participants</p>
                      </div>
                    </div>
                    <div className="text-right">
                      {group.isBooked ? (
                        <Badge variant="default">Booked</Badge>
                      ) : (
                        <p className="font-semibold text-primary-600">{formatPrice(Number(group.price))}</p>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Participant Count (Open Trip) */}
        {isOpenTrip && selectedDeparture && (
          <Card variant="bordered">
            <CardHeader><CardTitle className="flex items-center gap-2"><Users className="w-5 h-5" /> Number of Participants</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Input
                  type="number"
                  min={1}
                  max={selectedDeparture.maxParticipants ? selectedDeparture.maxParticipants - selectedDeparture._count.bookings : 20}
                  value={participantCount}
                  onChange={(e) => handleParticipantCountChange(parseInt(e.target.value) || 1)}
                  className="w-24"
                />
                <span className="text-slate-600">participant(s)</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Participants */}
        {(selectedDepartureId && (isOpenTrip || selectedGroupId)) && (
          <Card variant="bordered">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2"><User className="w-5 h-5" /> Participant Details</CardTitle>
              {isPrivateTrip && <Button type="button" variant="outline" size="sm" onClick={addParticipant}><Plus className="w-4 h-4" /> Add</Button>}
            </CardHeader>
            <CardContent className="space-y-6">
              {participants.map((participant, index) => (
                <div key={index} className="p-4 bg-slate-50 rounded-lg space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-slate-900">Participant {index + 1} {index === 0 && <Badge size="sm">Primary</Badge>}</h4>
                    {participants.length > 1 && (
                      <button type="button" onClick={() => removeParticipant(index)} className="p-1 text-red-500 hover:bg-red-50 rounded">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {savedParticipants.length > 0 && (
                    <Select
                      label="Use Saved Participant"
                      value={participant.id || ""}
                      onChange={(e) => useSavedParticipant(index, e.target.value)}
                      options={[
                        { value: "", label: "-- Enter new participant --" },
                        ...savedParticipants.map(p => ({ value: p.id, label: p.fullName }))
                      ]}
                    />
                  )}

                  <div className="grid md:grid-cols-2 gap-4">
                    <Input
                      label="Full Name *"
                      required
                      value={participant.fullName}
                      onChange={(e) => updateParticipant(index, "fullName", e.target.value)}
                      placeholder="As per ID card"
                    />
                    <Select
                      label="Gender *"
                      required
                      value={participant.gender}
                      onChange={(e) => updateParticipant(index, "gender", e.target.value)}
                      options={[
                        { value: "MALE", label: "Male" },
                        { value: "FEMALE", label: "Female" },
                      ]}
                    />
                    <Input
                      label="Birth Date"
                      type="date"
                      value={participant.birthDate}
                      onChange={(e) => updateParticipant(index, "birthDate", e.target.value)}
                    />
                    <KTPInput
                      label="ID Number (KTP)"
                      value={participant.idNumber}
                      onChange={(val) => updateParticipant(index, "idNumber", val)}
                      hint="16 digits, cannot start with 0"
                    />
                    <PhoneInput
                      label="Phone Number"
                      value={participant.phone}
                      onChange={(val) => updateParticipant(index, "phone", val)}
                    />
                    <Input
                      label="Domicile"
                      value={participant.domicile}
                      onChange={(e) => updateParticipant(index, "domicile", e.target.value)}
                      placeholder="e.g., Jakarta"
                    />
                  </div>
                  <Input
                    label="Health History / Allergies"
                    value={participant.healthHistory}
                    onChange={(e) => updateParticipant(index, "healthHistory", e.target.value)}
                    placeholder="Any medical conditions or allergies we should know about"
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Notes */}
        {(selectedDepartureId && (isOpenTrip || selectedGroupId)) && (
          <Card variant="bordered">
            <CardHeader><CardTitle>Additional Notes</CardTitle></CardHeader>
            <CardContent>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none resize-none"
                rows={3}
                placeholder="Any special requests or notes for your booking..."
              />
            </CardContent>
          </Card>
        )}

        {/* Summary & Submit */}
        {(selectedDepartureId && (isOpenTrip || selectedGroupId)) && (
          <Card variant="elevated">
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-slate-600">
                  <span>Package</span>
                  <span>{packageData.title}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Departure</span>
                  <span>{selectedDeparture && formatDate(new Date(selectedDeparture.departureDate))}</span>
                </div>
                {isPrivateTrip && selectedGroup && (
                  <div className="flex justify-between text-slate-600">
                    <span>Group</span>
                    <span>Group {selectedGroup.groupNumber}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600">
                  <span>Participants</span>
                  <span>{participants.length}</span>
                </div>
                {isOpenTrip && selectedDeparture?.pricePerPerson && (
                  <div className="flex justify-between text-slate-600">
                    <span>Price per person</span>
                    <span>{formatPrice(Number(selectedDeparture.pricePerPerson))}</span>
                  </div>
                )}
                <hr className="border-slate-200" />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-primary-600">{formatPrice(calculateTotal())}</span>
                </div>
                <p className="text-sm text-amber-600">⚠️ Payment must be completed within 24 hours or booking will expire.</p>
              </div>
              <Button type="submit" className="w-full mt-6" size="lg" loading={submitting}>
                <Check className="w-5 h-5" /> Confirm Booking
              </Button>
            </CardContent>
          </Card>
        )}
      </form>
    </div>
  );
}
