"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button, Input, Textarea, Alert, Card } from "@/components/ui";
import { customRequestSchema } from "@/lib/validations";
import { MapPin, Calendar, Users, Clock, CheckCircle } from "lucide-react";

export default function CustomRequestPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [error, setError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!session) {
      router.push("/login?callbackUrl=/custom-request");
      return;
    }

    setError("");
    setErrors({});
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      destination: formData.get("destination") as string,
      duration: formData.get("duration") as string,
      departureDate: formData.get("departureDate") as string,
      meetingPoint: formData.get("meetingPoint") as string,
      participantCount: parseInt(formData.get("participantCount") as string, 10),
      notes: formData.get("notes") as string,
    };

    const result = customRequestSchema.safeParse(data);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        if (issue.path[0]) fieldErrors[issue.path[0] as string] = issue.message;
      });
      setErrors(fieldErrors);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/custom-requests", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      const json = await res.json();

      if (!res.ok) {
        setError(json.error || "Failed to submit request");
        setLoading(false);
        return;
      }

      setSuccess(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center py-12">
        <Card variant="elevated" className="max-w-md text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Request Submitted!</h2>
          <p className="text-slate-600 mb-6">Thank you for your interest. Our team will review your request and get back to you soon.</p>
          <div className="flex gap-3 justify-center">
            <Link href="/dashboard/custom-requests" className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700">
              View My Requests
            </Link>
            <Link href="/packages" className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200">
              Browse Packages
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="py-12">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Request Custom Trip</h1>
            <p className="text-slate-600">Tell us about your dream adventure and we will create a personalized tour just for you</p>
          </div>

          {status === "unauthenticated" && (
            <Alert variant="warning" className="mb-6">
              Please <Link href="/login?callbackUrl=/custom-request" className="font-medium underline">sign in</Link> to submit a custom trip request.
            </Alert>
          )}

          {error && <Alert variant="error" className="mb-6">{error}</Alert>}

          <Card variant="elevated">
            <form onSubmit={handleSubmit} className="space-y-6">
              <Input name="destination" label="Destination" placeholder="e.g., Bali, Raja Ampat, Komodo" required error={errors.destination} />
              
              <div className="grid md:grid-cols-2 gap-4">
                <Input name="duration" label="Duration" placeholder="e.g., 3 Days 2 Nights" required error={errors.duration} />
                <Input name="participantCount" label="Number of Participants" type="number" min="1" max="100" required error={errors.participantCount} />
              </div>

              <Input name="departureDate" label="Preferred Departure Date" type="date" required error={errors.departureDate} min={new Date().toISOString().split("T")[0]} />
              
              <Input name="meetingPoint" label="Meeting/Pickup Point" placeholder="e.g., Jakarta, Bandung Airport" required error={errors.meetingPoint} />
              
              <Textarea name="notes" label="Additional Notes" placeholder="Tell us more about your preferences, activities you want, budget range, etc." rows={4} error={errors.notes} />

              <Button type="submit" fullWidth loading={loading} disabled={status === "unauthenticated"}>
                Submit Request
              </Button>
            </form>
          </Card>

          <div className="mt-8 grid md:grid-cols-3 gap-4 text-center">
            {[
              { icon: MapPin, text: "Custom destination" },
              { icon: Calendar, text: "Flexible dates" },
              { icon: Users, text: "Any group size" },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-center gap-2 text-slate-600">
                <item.icon className="w-5 h-5 text-emerald-600" />
                <span className="text-sm">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
