"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Select, Alert } from "@/components/ui";
import { BOOKING_STATUS_FLOW, BOOKING_STATUS_LABELS } from "@/types";

interface BookingStatusFormProps {
  bookingId: string;
  currentStatus: string;
}

export function BookingStatusForm({ bookingId, currentStatus }: BookingStatusFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const currentIndex = BOOKING_STATUS_FLOW.indexOf(currentStatus as typeof BOOKING_STATUS_FLOW[number]);
  const nextStatuses = BOOKING_STATUS_FLOW.slice(currentIndex + 1);

  const [newStatus, setNewStatus] = useState<string>(nextStatuses[0] || "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStatus) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update status");
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (nextStatuses.length === 0) {
    return <p className="text-slate-500">This booking has reached its final status.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <Alert variant="error">{error}</Alert>}

      <p className="text-sm text-slate-600">
        Current status: <span className="font-medium">{BOOKING_STATUS_LABELS[currentStatus as keyof typeof BOOKING_STATUS_LABELS]}</span>
      </p>

      <Select
        label="New Status"
        value={newStatus}
        onChange={(e) => setNewStatus(e.target.value as string)}
        options={nextStatuses.map((status) => ({
          value: status,
          label: BOOKING_STATUS_LABELS[status],
        }))}
      />

      <p className="text-xs text-amber-600">
        ⚠️ Status changes cannot be undone. Please verify before proceeding.
      </p>

      <Button type="submit" loading={loading}>
        Update Status
      </Button>
    </form>
  );
}
