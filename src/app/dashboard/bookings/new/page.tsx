"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { formatPrice, formatDate } from "@/lib/utils";
import { Button, Input, Select, Card, CardHeader, CardTitle, CardContent, Alert, Badge, PhoneInput, KTPInput } from "@/components/ui";
import { ArrowLeft, Plus, Minus, User, Calendar, MapPin, Users, Check, Loader2 } from "lucide-react";

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

function NewBookingForm() {
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
    { fullName: "", gender: "MALE", birthDate: "", idNumber: "", phone: "", domicile: "", healthHistory: "", isNew: true },
  ]);
  const [notes, setNotes] = useState("");

  // Derived values
  const selectedDeparture = packageData?.departures.find((d) => d.id === selectedDepartureId);
  const isPrivateTrip = packageData?.tripType === "PRIVATE_TRIP";
  const selectedGroup = selectedDeparture?.groups.find((g) => g.id === selectedGroupId);

  // Calculate available seats for open trips
  const bookedSeats = selectedDeparture?._count?.bookings || 0;
  const maxSeats = selectedDeparture?.maxParticipants || 0;
  const availableSeats = isPrivateTrip ? 99 : Math.max(0, maxSeats - bookedSeats);

  // Calculate total price
  const totalPrice = isPrivateTrip
    ? selectedGroup?.price || 0
    : (selectedDeparture?.pricePerPerson || 0) * participantCount;

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
        const [pkgRes, participantsRes] = await Promise.all([fetch(`/api/packages/${packageSlug}`), fetch("/api/participants")]);

        if (!pkgRes.ok) throw new Error("Package not found");

        const pkgData = await pkgRes.json();
        setPackageData(pkgData.data);

        if (participantsRes.ok) {
          const participantsData = await participantsRes.json();
          setSavedParticipants(participantsData.data || []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load package");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [packageSlug, status]);

  // Reset group selection when departure changes
  useEffect(() => {
    setSelectedGroupId("");
  }, [selectedDepartureId]);

  // Handle participant count change with validation
  const handleParticipantCountChange = (newCount: number) => {
    // Validate against available seats
    const maxAllowed = isPrivateTrip ? 99 : availableSeats;
    const validCount = Math.max(1, Math.min(newCount, maxAllowed));

    setParticipantCount(validCount);

    // Adjust participants array
    if (validCount > participants.length) {
      const newParticipants = [...participants];
      for (let i = participants.length; i < validCount; i++) {
        newParticipants.push({
          fullName: "",
          gender: "MALE",
          birthDate: "",
          idNumber: "",
          phone: "",
          domicile: "",
          healthHistory: "",
          isNew: true,
        });
      }
      setParticipants(newParticipants);
    } else if (validCount < participants.length) {
      setParticipants(participants.slice(0, validCount));
    }
  };

  // Update participant field
  const updateParticipant = (index: number, field: keyof ParticipantForm, value: string) => {
    const updated = [...participants];
    updated[index] = { ...updated[index], [field]: value, isNew: !updated[index].id || field !== "fullName" };
    setParticipants(updated);
  };

  // Select saved participant
  const selectSavedParticipant = (index: number, participantId: string) => {
    const saved = savedParticipants.find((p) => p.id === participantId);
    if (saved) {
      const updated = [...participants];
      updated[index] = {
        id: saved.id,
        fullName: saved.fullName,
        gender: saved.gender || "MALE",
        birthDate: saved.birthDate ? new Date(saved.birthDate).toISOString().split("T")[0] : "",
        idNumber: saved.idNumber || "",
        phone: saved.phone || "",
        domicile: saved.domicile || "",
        healthHistory: saved.healthHistory || "",
        isNew: false,
      };
      setParticipants(updated);
    }
  };

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

    // Validate participant count against available seats
    if (!isPrivateTrip && participantCount > availableSeats) {
      setError(`Only ${availableSeats} spots available. Please reduce the number of participants.`);
      setSubmitting(false);
      return;
    }

    const invalidParticipant = participants.find((p) => !p.fullName.trim());
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
          participants: participants.map((p) => ({
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
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!packageData) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <h1 className="text-2xl font-bold text-slate-900 mb-4">Package Not Found</h1>
        <p className="text-slate-600 mb-6">The package you&apos;re trying to book doesn&apos;t exist.</p>
        <Link href="/packages">
          <Button>Browse Packages</Button>
        </Link>
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
          <CardContent className="flex gap-4 p-4">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg bg-slate-100 overflow-hidden shrink-0">
              {packageData.thumbnail ? (
                <img src={packageData.thumbnail} alt={packageData.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400">
                  <MapPin className="w-8 h-8" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-slate-900 truncate">{packageData.title}</h3>
              <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-slate-600">
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {packageData.location}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {packageData.duration}
                </span>
              </div>
              <Badge variant={isPrivateTrip ? "warning" : "success"} className="mt-2">
                {isPrivateTrip ? "Private Trip" : "Open Trip"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Departure Selection */}
        <Card variant="bordered">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-600" />
              Select Departure Date
            </CardTitle>
          </CardHeader>
          <CardContent>
            {packageData.departures.length === 0 ? (
              <p className="text-slate-500">No departures available for this package.</p>
            ) : (
              <div className="grid gap-3">
                {packageData.departures.map((departure) => {
                  const depBookedSeats = departure._count?.bookings || 0;
                  const depMaxSeats = departure.maxParticipants || 0;
                  const depAvailable = depMaxSeats - depBookedSeats;
                  const isFull = !isPrivateTrip && depAvailable <= 0;
                  const allGroupsBooked = isPrivateTrip && departure.groups.every((g) => g.isBooked);

                  return (
                    <label
                      key={departure.id}
                      className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-all ${
                        selectedDepartureId === departure.id
                          ? "border-emerald-500 bg-emerald-50"
                          : isFull || allGroupsBooked
                            ? "border-slate-200 bg-slate-50 opacity-60 cursor-not-allowed"
                            : "border-slate-200 hover:border-emerald-300"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="departure"
                          value={departure.id}
                          checked={selectedDepartureId === departure.id}
                          onChange={(e) => setSelectedDepartureId(e.target.value)}
                          disabled={isFull || allGroupsBooked}
                          className="w-4 h-4 text-emerald-600"
                        />
                        <div>
                          <p className="font-medium text-slate-900">{formatDate(departure.departureDate)}</p>
                          {!isPrivateTrip && (
                            <p className="text-sm text-slate-500">
                              {isFull ? (
                                <span className="text-red-500">Fully booked</span>
                              ) : (
                                `${depAvailable} spots left`
                              )}
                            </p>
                          )}
                          {isPrivateTrip && (
                            <p className="text-sm text-slate-500">
                              {departure.groups.filter((g) => !g.isBooked).length} groups available
                            </p>
                          )}
                        </div>
                      </div>
                      {!isPrivateTrip && departure.pricePerPerson && (
                        <p className="font-semibold text-emerald-600">{formatPrice(Number(departure.pricePerPerson))}/pax</p>
                      )}
                    </label>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Group Selection for Private Trip */}
        {isPrivateTrip && selectedDeparture && (
          <Card variant="bordered">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-600" />
                Select Group
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {selectedDeparture.groups.map((group) => (
                  <label
                    key={group.id}
                    className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedGroupId === group.id
                        ? "border-emerald-500 bg-emerald-50"
                        : group.isBooked
                          ? "border-slate-200 bg-slate-50 opacity-60 cursor-not-allowed"
                          : "border-slate-200 hover:border-emerald-300"
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
                        className="w-4 h-4 text-emerald-600"
                      />
                      <div>
                        <p className="font-medium text-slate-900">Group {group.groupNumber}</p>
                        <p className="text-sm text-slate-500">
                          {group.isBooked ? (
                            <span className="text-red-500">Already booked</span>
                          ) : (
                            `Up to ${group.maxParticipants} participants`
                          )}
                        </p>
                      </div>
                    </div>
                    <p className="font-semibold text-emerald-600">{formatPrice(Number(group.price))}</p>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Participant Count - Only for Open Trip */}
        {!isPrivateTrip && selectedDeparture && (
          <Card variant="bordered">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-600" />
                Number of Participants
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleParticipantCountChange(participantCount - 1)}
                    disabled={participantCount <= 1}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <Input
                    type="number"
                    min={1}
                    max={availableSeats}
                    value={participantCount}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      if (!isNaN(val)) {
                        handleParticipantCountChange(val);
                      }
                    }}
                    className="w-20 text-center"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleParticipantCountChange(participantCount + 1)}
                    disabled={participantCount >= availableSeats}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <span className="text-sm text-slate-500">({availableSeats} spots available)</span>
              </div>
              {participantCount >= availableSeats && availableSeats > 0 && (
                <p className="text-sm text-amber-600 mt-2">Maximum participants reached for this departure.</p>
              )}
              {availableSeats === 0 && <p className="text-sm text-red-600 mt-2">No spots available for this departure.</p>}
            </CardContent>
          </Card>
        )}

        {/* Participant Details */}
        <Card variant="bordered">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-emerald-600" />
              Participant Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {participants.map((participant, index) => (
              <div key={index} className="p-4 bg-slate-50 rounded-lg space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h4 className="font-medium text-slate-900">
                    Participant {index + 1}
                    {index === 0 && <span className="text-emerald-600 ml-2">(Primary Contact)</span>}
                  </h4>
                  {savedParticipants.length > 0 && (
                    <select
                      className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white max-w-full sm:max-w-50"
                      value={participant.id || ""}
                      onChange={(e) => selectSavedParticipant(index, e.target.value)}
                    >
                      <option value="">Select saved participant...</option>
                      {savedParticipants.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.fullName}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Form Grid - Responsive */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Full Name"
                    required
                    value={participant.fullName}
                    onChange={(e) => updateParticipant(index, "fullName", e.target.value)}
                    placeholder="As per ID card"
                  />
                  <Select
                    label="Gender"
                    value={participant.gender}
                    onChange={(e) => updateParticipant(index, "gender", e.target.value)}
                    options={[
                      { value: "MALE", label: "Male" },
                      { value: "FEMALE", label: "Female" },
                    ]}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Birth Date"
                    type="date"
                    value={participant.birthDate}
                    onChange={(e) => updateParticipant(index, "birthDate", e.target.value)}
                  />
                  <KTPInput
                    label="ID Number (KTP)"
                    value={participant.idNumber}
                    onChange={(value) => updateParticipant(index, "idNumber", value)}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <PhoneInput
                    label="Phone Number"
                    value={participant.phone}
                    onChange={(value) => updateParticipant(index, "phone", value)}
                  />
                  <Input
                    label="Domicile"
                    value={participant.domicile}
                    onChange={(e) => updateParticipant(index, "domicile", e.target.value)}
                    placeholder="City of residence"
                  />
                </div>

                <Input
                  label="Health History"
                  value={participant.healthHistory}
                  onChange={(e) => updateParticipant(index, "healthHistory", e.target.value)}
                  placeholder="Allergies, medical conditions, etc. (optional)"
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Additional Notes */}
        <Card variant="bordered">
          <CardHeader>
            <CardTitle>Additional Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any special requests or notes for the tour organizer..."
              rows={3}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 resize-none"
            />
          </CardContent>
        </Card>

        {/* Price Summary */}
        {selectedDeparture && (
          <Card variant="bordered" className="bg-emerald-50 border-emerald-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Total Price</p>
                  <p className="text-2xl font-bold text-emerald-600">{formatPrice(totalPrice)}</p>
                  {!isPrivateTrip && (
                    <p className="text-sm text-slate-500">
                      {formatPrice(Number(selectedDeparture.pricePerPerson))} x {participantCount} participant(s)
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-600">Payment Deadline</p>
                  <p className="text-sm font-medium text-slate-900">24 hours after booking</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Submit Button */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link href={`/packages/${packageData.slug}`} className="flex-1">
            <Button type="button" variant="outline" className="w-full">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            className="flex-1"
            loading={submitting}
            disabled={!selectedDepartureId || (isPrivateTrip && !selectedGroupId) || availableSeats === 0}
          >
            <Check className="w-4 h-4" />
            Confirm Booking
          </Button>
        </div>

        <p className="text-sm text-slate-500 text-center">
          By confirming, you agree to our terms and conditions. Payment must be completed within 24 hours.
        </p>
      </form>
    </div>
  );
}

export default function NewBookingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-100px">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
      }
    >
      <NewBookingForm />
    </Suspense>
  );
}