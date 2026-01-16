"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Select, Textarea, Alert } from "@/components/ui";
import { CUSTOM_REQUEST_STATUS_FLOW, CUSTOM_REQUEST_STATUS_LABELS } from "@/types";

interface Props {
  requestId: string;
  currentStatus: string;
  currentEstimatedPrice?: number;
  currentFinalPrice?: number;
  currentTourGuideId?: string;
  tourGuides: { id: string; name: string }[];
}

export function CustomRequestStatusForm({ requestId, currentStatus, currentEstimatedPrice, currentFinalPrice, currentTourGuideId, tourGuides }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const currentIndex = CUSTOM_REQUEST_STATUS_FLOW.indexOf(currentStatus as typeof CUSTOM_REQUEST_STATUS_FLOW[number]);
  const nextStatuses = CUSTOM_REQUEST_STATUS_FLOW.slice(currentIndex + 1);

  const [form, setForm] = useState({
    status: nextStatuses[0] || currentStatus,
    estimatedPrice: currentEstimatedPrice || 0,
    finalPrice: currentFinalPrice || 0,
    tourGuideId: currentTourGuideId || "",
    adminNotes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (form.status === "ACCEPTED" && !form.finalPrice) {
      setError("Final price is required when accepting a request");
      setLoading(false);
      return;
    }

    if (form.status === "ONGOING" && !form.tourGuideId) {
      setError("Tour guide must be assigned before marking as ongoing");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/admin/custom-requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error((await res.json()).error || "Failed to update");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const showEstimatedPrice = ["IN_REVIEW"].includes(currentStatus) || currentStatus === "PENDING";
  const showFinalPrice = currentStatus === "IN_REVIEW" || (currentStatus === "ACCEPTED" && !currentFinalPrice);
  const showTourGuide = ["PROCESSED", "ONGOING"].includes(form.status) || currentStatus === "PROCESSED";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <Alert variant="error">{error}</Alert>}

      <p className="text-sm text-slate-600">Current: <span className="font-medium">{CUSTOM_REQUEST_STATUS_LABELS[currentStatus as keyof typeof CUSTOM_REQUEST_STATUS_LABELS]}</span></p>

      {nextStatuses.length > 0 && (
        <Select
          label="New Status"
          value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value })}
          options={nextStatuses.map((s) => ({ value: s, label: CUSTOM_REQUEST_STATUS_LABELS[s] }))}
        />
      )}

      {showEstimatedPrice && (
        <Input
          label="Estimated Price (IDR)"
          type="number"
          min={0}
          value={form.estimatedPrice}
          onChange={(e) => setForm({ ...form, estimatedPrice: parseInt(e.target.value) || 0 })}
          hint="You can update this multiple times while in review"
        />
      )}

      {showFinalPrice && (
        <Input
          label="Final Price (IDR)"
          type="number"
          min={0}
          value={form.finalPrice}
          onChange={(e) => setForm({ ...form, finalPrice: parseInt(e.target.value) || 0 })}
          hint="Required when accepting the request"
        />
      )}

      {showTourGuide && (
        <Select
          label="Assign Tour Guide"
          value={form.tourGuideId}
          onChange={(e) => setForm({ ...form, tourGuideId: e.target.value })}
          options={[{ value: "", label: "Select a tour guide" }, ...tourGuides.map((g) => ({ value: g.id, label: g.name }))]}
        />
      )}

      <Textarea
        label="Admin Notes"
        value={form.adminNotes}
        onChange={(e) => setForm({ ...form, adminNotes: e.target.value })}
        placeholder="Add notes about this request..."
        rows={3}
      />

      <p className="text-xs text-amber-600">⚠️ Status changes cannot be undone.</p>

      <Button type="submit" loading={loading}>Update Request</Button>
    </form>
  );
}
