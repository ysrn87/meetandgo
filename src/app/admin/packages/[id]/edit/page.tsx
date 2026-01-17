"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button, Input, Textarea, Select, Card, CardHeader, CardTitle, CardContent, Alert, CurrencyInput } from "@/components/ui";
import { Plus, Trash2, ArrowLeft, Save, AlertTriangle, Loader2 } from "lucide-react";
import Link from "next/link";

type HighlightForm = { id?: string; title: string; description: string; image: string };
type ActivityForm = { id?: string; startTime: string; endTime: string; activity: string; description: string };
type ItineraryForm = { id?: string; day: number; title: string; activities: ActivityForm[] };
type MeetingPointForm = { id?: string; name: string; address: string; time: string };
type DepartureGroupForm = { id?: string; groupNumber: number; price: number; maxParticipants: number; isBooked?: boolean };
type DepartureForm = { id?: string; departureDate: string; pricePerPerson: number; maxParticipants: number; groups: DepartureGroupForm[]; hasBookings?: boolean };

type ValidationErrors = {
  highlights?: string;
  itineraries?: string;
  includedItems?: string;
  excludedItems?: string;
  meetingPoints?: string;
  departures?: string;
  general?: string;
};

export default function EditPackagePage() {
  const router = useRouter();
  const params = useParams();
  const packageId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [hasAnyBookings, setHasAnyBookings] = useState(false);

  const [form, setForm] = useState({
    title: "",
    tripType: "OPEN_TRIP" as "OPEN_TRIP" | "PRIVATE_TRIP",
    location: "",
    description: "",
    duration: "",
    durationDays: 1,
    thumbnail: "",
    isActive: true,
  });

  const [highlights, setHighlights] = useState<HighlightForm[]>([{ title: "", description: "", image: "" }]);
  const [itineraries, setItineraries] = useState<ItineraryForm[]>([{ day: 1, title: "Day 1", activities: [{ startTime: "08:00", endTime: "09:00", activity: "", description: "" }] }]);
  const [includedItems, setIncludedItems] = useState<string[]>([""]);
  const [excludedItems, setExcludedItems] = useState<string[]>([""]);
  const [meetingPoints, setMeetingPoints] = useState<MeetingPointForm[]>([{ name: "", address: "", time: "" }]);
  const [departures, setDepartures] = useState<DepartureForm[]>([{ departureDate: "", pricePerPerson: 0, maxParticipants: 10, groups: [] }]);

  // Fetch package data
  useEffect(() => {
    async function fetchPackage() {
      try {
        const res = await fetch(`/api/admin/packages/${packageId}`);
        if (!res.ok) throw new Error("Failed to fetch package");
        const data = await res.json();

        setForm({
          title: data.title || "",
          tripType: data.tripType || "OPEN_TRIP",
          location: data.location || "",
          description: data.description || "",
          duration: data.duration || "",
          durationDays: data.durationDays || 1,
          thumbnail: data.thumbnail || "",
          isActive: data.isActive ?? true,
        });

        // Highlights
        if (data.highlights && data.highlights.length > 0) {
          setHighlights(data.highlights.map((h: any) => ({
            id: h.id,
            title: h.title || "",
            description: h.description || "",
            image: h.image || "",
          })));
        } else {
          setHighlights([{ title: "", description: "", image: "" }]);
        }

        // Itineraries
        if (data.itineraries && data.itineraries.length > 0) {
          setItineraries(data.itineraries.map((it: any) => ({
            id: it.id,
            day: it.day,
            title: it.title || `Day ${it.day}`,
            activities: it.activities && it.activities.length > 0 
              ? it.activities.map((a: any) => ({
                  id: a.id,
                  startTime: a.startTime || "08:00",
                  endTime: a.endTime || "09:00",
                  activity: a.activity || "",
                  description: a.description || "",
                }))
              : [{ startTime: "08:00", endTime: "09:00", activity: "", description: "" }],
          })));
        } else {
          setItineraries([{ day: 1, title: "Day 1", activities: [{ startTime: "08:00", endTime: "09:00", activity: "", description: "" }] }]);
        }

        // Included Items - these are objects with { id, item, order }
        if (data.includedItems && data.includedItems.length > 0) {
          setIncludedItems(data.includedItems.map((i: any) => i.item || ""));
        } else {
          setIncludedItems([""]);
        }

        // Excluded Items - these are objects with { id, item, order }
        if (data.excludedItems && data.excludedItems.length > 0) {
          setExcludedItems(data.excludedItems.map((i: any) => i.item || ""));
        } else {
          setExcludedItems([""]);
        }

        // Meeting Points
        if (data.meetingPoints && data.meetingPoints.length > 0) {
          setMeetingPoints(data.meetingPoints.map((m: any) => ({
            id: m.id,
            name: m.name || "",
            address: m.address || "",
            time: m.time || "",
          })));
        } else {
          setMeetingPoints([{ name: "", address: "", time: "" }]);
        }

        // Departures
        if (data.departures && data.departures.length > 0) {
          const deps = data.departures.map((d: any) => ({
            id: d.id,
            departureDate: d.departureDate ? new Date(d.departureDate).toISOString().split("T")[0] : "",
            pricePerPerson: d.pricePerPerson ? Number(d.pricePerPerson) : 0,
            maxParticipants: d.maxParticipants || 10,
            hasBookings: d._count?.bookings > 0,
            groups: d.groups && d.groups.length > 0 
              ? d.groups.map((g: any) => ({
                  id: g.id,
                  groupNumber: g.groupNumber,
                  price: Number(g.price) || 0,
                  maxParticipants: g.maxParticipants || 5,
                  isBooked: g.isBooked || false,
                }))
              : [],
          }));
          setDepartures(deps);
          setHasAnyBookings(deps.some((d: DepartureForm) => d.hasBookings || d.groups.some((g: DepartureGroupForm) => g.isBooked)));
        } else {
          setDepartures([{ departureDate: "", pricePerPerson: 0, maxParticipants: 10, groups: [] }]);
        }

        setError("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load package");
      } finally {
        setLoading(false);
      }
    }
    fetchPackage();
  }, [packageId]);

  // Validation function
  const validate = (): boolean => {
    const errors: ValidationErrors = {};

    const validHighlights = highlights.filter(h => h.title.trim());
    if (validHighlights.length === 0) {
      errors.highlights = "At least one highlight is required";
    }

    const validItineraries = itineraries.filter(it => it.activities.some(a => a.activity.trim()));
    if (validItineraries.length === 0) {
      errors.itineraries = "At least one itinerary day with an activity is required";
    } else if (itineraries.length > form.durationDays) {
      errors.itineraries = `Number of itinerary days (${itineraries.length}) cannot exceed trip duration (${form.durationDays} days)`;
    }

    const validIncluded = includedItems.filter(i => i.trim());
    if (validIncluded.length === 0) {
      errors.includedItems = "At least one included item is required";
    }

    const validExcluded = excludedItems.filter(i => i.trim());
    if (validExcluded.length === 0) {
      errors.excludedItems = "At least one excluded item is required";
    }

    const validMeetingPoints = meetingPoints.filter(m => m.name.trim());
    if (validMeetingPoints.length === 0) {
      errors.meetingPoints = "At least one meeting point is required";
    }

    const validDepartures = departures.filter(d => d.departureDate);
    if (validDepartures.length === 0) {
      errors.departures = "At least one departure schedule is required";
    } else if (form.tripType === "PRIVATE_TRIP") {
      const hasGroups = validDepartures.every(d => d.groups.length > 0);
      if (!hasGroups) {
        errors.departures = "Each departure must have at least one group for private trips";
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setValidationErrors({});

    if (!validate()) {
      setSaving(false);
      setError("Please fix the validation errors below");
      return;
    }

    try {
      const payload = {
        ...form,
        highlights: highlights.filter(h => h.title.trim()).map((h, i) => ({ ...h, order: i })),
        itineraries: itineraries.map(it => ({
          ...it,
          activities: it.activities.filter(a => a.activity.trim()).map((a, i) => ({ ...a, order: i })),
        })).filter(it => it.activities.length > 0),
        includedItems: includedItems.filter(i => i.trim()),
        excludedItems: excludedItems.filter(i => i.trim()),
        meetingPoints: meetingPoints.filter(m => m.name.trim()).map((m, i) => ({ ...m, order: i })),
        departures: departures.filter(d => d.departureDate).map(d => ({
          ...d,
          groups: form.tripType === "PRIVATE_TRIP" ? d.groups : [],
        })),
      };

      const res = await fetch(`/api/admin/packages/${packageId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error((await res.json()).error || "Failed to update package");
      router.push("/admin/packages");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  // Highlight functions
  const addHighlight = () => setHighlights([...highlights, { title: "", description: "", image: "" }]);
  const removeHighlight = (i: number) => {
    if (highlights.length <= 1) return;
    setHighlights(highlights.filter((_, idx) => idx !== i));
  };

  // Itinerary functions
  const addItinerary = () => {
    if (itineraries.length >= form.durationDays) {
      setValidationErrors({ ...validationErrors, itineraries: `Cannot add more days. Maximum is ${form.durationDays} days.` });
      return;
    }
    const newDay = itineraries.length + 1;
    setItineraries([...itineraries, { day: newDay, title: `Day ${newDay}`, activities: [{ startTime: "08:00", endTime: "09:00", activity: "", description: "" }] }]);
    setValidationErrors({ ...validationErrors, itineraries: undefined });
  };

  const removeItinerary = (dayIdx: number) => {
    if (itineraries.length <= 1) return;
    const updated = itineraries.filter((_, i) => i !== dayIdx).map((it, i) => ({
      ...it,
      day: i + 1,
      title: it.title.startsWith("Day ") ? `Day ${i + 1}` : it.title,
    }));
    setItineraries(updated);
  };

  const addActivity = (dayIdx: number) => {
    const updated = [...itineraries];
    updated[dayIdx].activities.push({ startTime: "", endTime: "", activity: "", description: "" });
    setItineraries(updated);
  };

  const removeActivity = (dayIdx: number, actIdx: number) => {
    if (itineraries[dayIdx].activities.length <= 1) return;
    const updated = [...itineraries];
    updated[dayIdx].activities = updated[dayIdx].activities.filter((_, i) => i !== actIdx);
    setItineraries(updated);
  };

  // Departure functions
  const addDeparture = () => setDepartures([...departures, { departureDate: "", pricePerPerson: 0, maxParticipants: 10, groups: [] }]);
  
  const removeDeparture = (i: number) => {
    if (departures.length <= 1) return;
    const dep = departures[i];
    if (dep.hasBookings || dep.groups.some(g => g.isBooked)) {
      setError("Cannot remove departure with existing bookings");
      return;
    }
    setDepartures(departures.filter((_, idx) => idx !== i));
  };

  const addGroup = (depIdx: number) => {
    const updated = [...departures];
    const newNum = updated[depIdx].groups.length + 1;
    updated[depIdx].groups.push({ groupNumber: newNum, price: 0, maxParticipants: 5 });
    setDepartures(updated);
  };

  const removeGroup = (depIdx: number, gIdx: number) => {
    const group = departures[depIdx].groups[gIdx];
    if (group.isBooked) {
      setError("Cannot remove group with existing booking");
      return;
    }
    const updated = [...departures];
    updated[depIdx].groups = updated[depIdx].groups.filter((_, i) => i !== gIdx).map((g, i) => ({ ...g, groupNumber: i + 1 }));
    setDepartures(updated);
  };

  const handleDurationDaysChange = (days: number) => {
    setForm({ ...form, durationDays: days });
    if (itineraries.length > days) {
      setItineraries(itineraries.slice(0, days).map((it, i) => ({ ...it, day: i + 1 })));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-100">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/packages" className="p-2 rounded-lg hover:bg-slate-100">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Edit Package</h1>
          <p className="text-slate-600">Update the tour package details</p>
        </div>
      </div>

      {hasAnyBookings && (
        <Alert variant="warning">
          <AlertTriangle className="w-4 h-4" />
          <span>This package has existing bookings. Some departures/groups cannot be removed.</span>
        </Alert>
      )}

      {error && <Alert variant="error">{error}</Alert>}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <Card variant="bordered">
          <CardHeader><CardTitle>Basic Information</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Input label="Package Title" required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g., Bali Paradise Adventure" />
            <div className="grid md:grid-cols-2 gap-4">
              <Select 
                label="Trip Type" 
                required 
                value={form.tripType} 
                onChange={e => setForm({ ...form, tripType: e.target.value as "OPEN_TRIP" | "PRIVATE_TRIP" })} 
                options={[
                  { value: "OPEN_TRIP", label: "Open Trip (Price per Person)" }, 
                  { value: "PRIVATE_TRIP", label: "Private Trip (Price per Group)" }
                ]} 
                disabled={hasAnyBookings}
              />
              <Input label="Location" required value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="e.g., Bali, Indonesia" />
            </div>
            <Input
              label="Thumbnail URL"
              value={form.thumbnail}
              onChange={(e) => setForm({ ...form, thumbnail: e.target.value })}
              placeholder="https://example.com/image.jpg"
              hint="Paste an image URL (e.g., from Unsplash, Cloudinary)"
            />
            <div className="grid md:grid-cols-2 gap-4">
              <Input label="Duration Text" required value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })} placeholder="e.g., 3 Days 2 Nights" />
              <Input
                label="Duration (Days)"
                type="number"
                required
                min={1}
                max={30}
                value={form.durationDays}
                onChange={e => handleDurationDaysChange(parseInt(e.target.value) || 1)}
                hint="This limits the number of itinerary days"
              />
            </div>
            <Textarea label="Description" required rows={4} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Describe the tour package in detail..." />
            <Select
              label="Status"
              value={form.isActive ? "active" : "inactive"}
              onChange={e => setForm({ ...form, isActive: e.target.value === "active" })}
              options={[
                { value: "active", label: "Active (Visible to customers)" },
                { value: "inactive", label: "Inactive (Hidden)" },
              ]}
            />
          </CardContent>
        </Card>

        {/* Highlights */}
        <Card variant="bordered">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Highlights *</CardTitle>
              {validationErrors.highlights && (
                <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4" /> {validationErrors.highlights}
                </p>
              )}
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addHighlight}><Plus className="w-4 h-4" /> Add</Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {highlights.map((h, i) => (
              <div key={h.id || i} className="flex gap-4 items-center p-3 bg-slate-50 rounded-lg">
                <div className="flex-1 grid md:grid-cols-2 gap-4">
                  <Input placeholder="Highlight title *" value={h.title} onChange={e => { const u = [...highlights]; u[i].title = e.target.value; setHighlights(u); }} />
                  <Input placeholder="Description (optional)" value={h.description} onChange={e => { const u = [...highlights]; u[i].description = e.target.value; setHighlights(u); }} />
                </div>
                {highlights.length > 1 && (
                  <button type="button" onClick={() => removeHighlight(i)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Itineraries */}
        <Card variant="bordered">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Itineraries * ({itineraries.length}/{form.durationDays} days)</CardTitle>
              {validationErrors.itineraries && (
                <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4" /> {validationErrors.itineraries}
                </p>
              )}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addItinerary}
              disabled={itineraries.length >= form.durationDays}
            >
              <Plus className="w-4 h-4" /> Add Day
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            {itineraries.map((it, dayIdx) => (
              <div key={it.id || dayIdx} className="p-4 bg-slate-50 rounded-lg space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <Input className="max-w-xs" placeholder="Day title" value={it.title} onChange={e => { const u = [...itineraries]; u[dayIdx].title = e.target.value; setItineraries(u); }} />
                  <div className="flex gap-2">
                    <Button type="button" variant="ghost" size="sm" onClick={() => addActivity(dayIdx)}><Plus className="w-4 h-4" /> Activity</Button>
                    {itineraries.length > 1 && (
                      <button type="button" onClick={() => removeItinerary(dayIdx)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="space-y-3">
                  {it.activities.map((act, actIdx) => (
                    <div key={act.id || actIdx} className="flex gap-3 items-center bg-white p-3 rounded-lg flex-wrap">
                      <Input className="w-24" type="time" value={act.startTime} onChange={e => { const u = [...itineraries]; u[dayIdx].activities[actIdx].startTime = e.target.value; setItineraries(u); }} />
                      <span className="text-slate-400">-</span>
                      <Input className="w-24" type="time" value={act.endTime} onChange={e => { const u = [...itineraries]; u[dayIdx].activities[actIdx].endTime = e.target.value; setItineraries(u); }} />
                      <Input className="flex-1 min-w-50" placeholder="Activity *" value={act.activity} onChange={e => { const u = [...itineraries]; u[dayIdx].activities[actIdx].activity = e.target.value; setItineraries(u); }} />
                      {it.activities.length > 1 && (
                        <button type="button" onClick={() => removeActivity(dayIdx, actIdx)} className="p-2 text-red-500 hover:bg-red-50 rounded">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Includes/Excludes */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card variant="bordered">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Included Items *</CardTitle>
                {validationErrors.includedItems && (
                  <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4" /> {validationErrors.includedItems}
                  </p>
                )}
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={() => setIncludedItems([...includedItems, ""])}><Plus className="w-4 h-4" /></Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {includedItems.map((item, i) => (
                <div key={i} className="flex gap-2">
                  <Input placeholder="e.g., Accommodation" value={item} onChange={e => { const u = [...includedItems]; u[i] = e.target.value; setIncludedItems(u); }} />
                  {includedItems.length > 1 && (
                    <button type="button" onClick={() => setIncludedItems(includedItems.filter((_, idx) => idx !== i))} className="p-2 text-red-500 hover:bg-red-50 rounded">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
          <Card variant="bordered">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Excluded Items *</CardTitle>
                {validationErrors.excludedItems && (
                  <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4" /> {validationErrors.excludedItems}
                  </p>
                )}
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={() => setExcludedItems([...excludedItems, ""])}><Plus className="w-4 h-4" /></Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {excludedItems.map((item, i) => (
                <div key={i} className="flex gap-2">
                  <Input placeholder="e.g., Personal expenses" value={item} onChange={e => { const u = [...excludedItems]; u[i] = e.target.value; setExcludedItems(u); }} />
                  {excludedItems.length > 1 && (
                    <button type="button" onClick={() => setExcludedItems(excludedItems.filter((_, idx) => idx !== i))} className="p-2 text-red-500 hover:bg-red-50 rounded">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Meeting Points */}
        <Card variant="bordered">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Meeting Points *</CardTitle>
              {validationErrors.meetingPoints && (
                <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4" /> {validationErrors.meetingPoints}
                </p>
              )}
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => setMeetingPoints([...meetingPoints, { name: "", address: "", time: "" }])}><Plus className="w-4 h-4" /> Add</Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {meetingPoints.map((mp, i) => (
              <div key={mp.id || i} className="flex gap-4 items-center p-3 bg-slate-50 rounded-lg flex-wrap">
                <Input className="flex-1 min-w-37.5" placeholder="Meeting point name *" value={mp.name} onChange={e => { const u = [...meetingPoints]; u[i].name = e.target.value; setMeetingPoints(u); }} />
                <Input className="flex-1 min-w-37.5" placeholder="Address (optional)" value={mp.address} onChange={e => { const u = [...meetingPoints]; u[i].address = e.target.value; setMeetingPoints(u); }} />
                <Input className="w-28" type="time" placeholder="Time" value={mp.time} onChange={e => { const u = [...meetingPoints]; u[i].time = e.target.value; setMeetingPoints(u); }} />
                {meetingPoints.length > 1 && (
                  <button type="button" onClick={() => setMeetingPoints(meetingPoints.filter((_, idx) => idx !== i))} className="p-2 text-red-500 hover:bg-red-50 rounded">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Departures */}
        <Card variant="bordered">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Departure Schedules *</CardTitle>
              {validationErrors.departures && (
                <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4" /> {validationErrors.departures}
                </p>
              )}
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addDeparture}><Plus className="w-4 h-4" /> Add Schedule</Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {departures.map((dep, depIdx) => (
              <div key={dep.id || depIdx} className={`p-4 rounded-lg space-y-4 ${dep.hasBookings ? "bg-amber-50 border border-amber-200" : "bg-slate-50"}`}>
                {dep.hasBookings && (
                  <p className="text-sm text-amber-700 flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4" /> This departure has existing bookings and cannot be removed
                  </p>
                )}
                <div className="flex gap-4 items-end flex-wrap">
                  <Input
                    className="flex-1 min-w-50"
                    label="Departure Date *"
                    type="date"
                    required
                    value={dep.departureDate}
                    onChange={e => { const u = [...departures]; u[depIdx].departureDate = e.target.value; setDepartures(u); }}
                    disabled={dep.hasBookings}
                  />
                  {form.tripType === "OPEN_TRIP" ? (
                    <>
                      <CurrencyInput
                        className="w-48"
                        label="Price/Person *"
                        value={dep.pricePerPerson}
                        onChange={val => { const u = [...departures]; u[depIdx].pricePerPerson = val; setDepartures(u); }}
                      />
                      <Input
                        className="w-32"
                        label="Max Pax"
                        type="number"
                        min={1}
                        value={dep.maxParticipants}
                        onChange={e => { const u = [...departures]; u[depIdx].maxParticipants = parseInt(e.target.value) || 10; setDepartures(u); }}
                      />
                    </>
                  ) : (
                    <Button type="button" variant="outline" size="sm" onClick={() => addGroup(depIdx)} className="mb-0.5">
                      <Plus className="w-4 h-4" /> Add Group
                    </Button>
                  )}
                  {departures.length > 1 && !dep.hasBookings && !dep.groups.some(g => g.isBooked) && (
                    <button type="button" onClick={() => removeDeparture(depIdx)} className="p-2 text-red-500 hover:bg-red-50 rounded mb-0.5">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                {form.tripType === "PRIVATE_TRIP" && dep.groups.length > 0 && (
                  <div className="space-y-2 pl-4 border-l-2 border-emerald-200">
                    {dep.groups.map((g, gIdx) => (
                      <div key={g.id || gIdx} className={`flex gap-3 items-center p-3 rounded-lg flex-wrap ${g.isBooked ? "bg-amber-50 border border-amber-200" : "bg-white"}`}>
                        <span className="text-sm font-medium text-slate-600 w-20">
                          Group {g.groupNumber}
                          {g.isBooked && <span className="text-amber-600 text-xs ml-1">(Booked)</span>}
                        </span>
                        <CurrencyInput
                          className="w-44"
                          label="Price *"
                          value={g.price}
                          onChange={val => { const u = [...departures]; u[depIdx].groups[gIdx].price = val; setDepartures(u); }}
                        />
                        <Input
                          className="w-28"
                          label="Max Pax"
                          type="number"
                          min={1}
                          value={g.maxParticipants}
                          onChange={e => { const u = [...departures]; u[depIdx].groups[gIdx].maxParticipants = parseInt(e.target.value) || 5; setDepartures(u); }}
                        />
                        {!g.isBooked && (
                          <button type="button" onClick={() => removeGroup(depIdx, gIdx)} className="p-2 text-red-500 hover:bg-red-50 rounded mt-6">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {form.tripType === "PRIVATE_TRIP" && dep.groups.length === 0 && (
                  <p className="text-sm text-amber-600 flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4" /> Please add at least one group for this departure
                  </p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Link href="/admin/packages"><Button type="button" variant="outline">Cancel</Button></Link>
          <Button type="submit" loading={saving}><Save className="w-4 h-4" /> Save Changes</Button>
        </div>
      </form>
    </div>
  );
}
