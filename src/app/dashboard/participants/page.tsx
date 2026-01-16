"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { formatDate } from "@/lib/utils";
import { Button, Input, Select, Card, CardHeader, CardTitle, CardContent, Alert, Modal, PhoneInput, KTPInput } from "@/components/ui";
import { Plus, Edit, Trash2, User, Users, Save, X } from "lucide-react";

interface Participant {
  id: string;
  fullName: string;
  gender: string;
  birthDate: string | null;
  idNumber: string | null;
  phone: string | null;
  domicile: string | null;
  healthHistory: string | null;
}

interface ParticipantForm {
  fullName: string;
  gender: string;
  birthDate: string;
  idNumber: string;
  phone: string;
  domicile: string;
  healthHistory: string;
}

const emptyForm: ParticipantForm = {
  fullName: "",
  gender: "MALE",
  birthDate: "",
  idNumber: "",
  phone: "",
  domicile: "",
  healthHistory: "",
};

export default function ParticipantsPage() {
  const router = useRouter();
  const { status } = useSession();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [participants, setParticipants] = useState<Participant[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ParticipantForm>(emptyForm);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetchParticipants();
  }, [status]);

  const fetchParticipants = async () => {
    try {
      const res = await fetch("/api/participants");
      if (res.ok) {
        const data = await res.json();
        setParticipants(data.data || []);
      }
    } catch (err) {
      setError("Failed to load participants");
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEditModal = (participant: Participant) => {
    setEditingId(participant.id);
    setForm({
      fullName: participant.fullName,
      gender: participant.gender,
      birthDate: participant.birthDate ? participant.birthDate.split("T")[0] : "",
      idNumber: participant.idNumber || "",
      phone: participant.phone || "",
      domicile: participant.domicile || "",
      healthHistory: participant.healthHistory || "",
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const url = editingId ? `/api/participants/${editingId}` : "/api/participants";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          birthDate: form.birthDate || undefined,
          idNumber: form.idNumber || undefined,
          phone: form.phone || undefined,
          domicile: form.domicile || undefined,
          healthHistory: form.healthHistory || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save participant");
      }

      setSuccess(editingId ? "Participant updated" : "Participant added");
      setShowModal(false);
      fetchParticipants();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setSubmitting(true);

    try {
      const res = await fetch(`/api/participants/${deleteId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete");
      }

      setSuccess("Participant deleted");
      setDeleteId(null);
      fetchParticipants();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setSubmitting(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Saved Participants</h1>
          <p className="text-slate-600">Manage participant data for faster booking</p>
        </div>
        <Button onClick={openAddModal}><Plus className="w-4 h-4" /> Add Participant</Button>
      </div>

      {error && <Alert variant="error" onClose={() => setError("")}>{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      {participants.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {participants.map((p) => (
            <Card key={p.id} variant="bordered">
              <CardContent className="flex items-start justify-between">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <User className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-900">{p.fullName}</h3>
                    <p className="text-sm text-slate-500">{p.gender === "MALE" ? "Male" : "Female"}</p>
                    {p.idNumber && <p className="text-sm text-slate-500">ID: {p.idNumber}</p>}
                    {p.phone && <p className="text-sm text-slate-500">{p.phone}</p>}
                    {p.domicile && <p className="text-sm text-slate-500">{p.domicile}</p>}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEditModal(p)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button onClick={() => setDeleteId(p.id)} className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card variant="bordered">
          <CardContent className="text-center py-12">
            <Users className="w-12 h-12 mx-auto mb-4 text-slate-300" />
            <h3 className="font-medium text-slate-900 mb-2">No saved participants</h3>
            <p className="text-slate-500 mb-6">Add participants to speed up your booking process</p>
            <Button onClick={openAddModal}><Plus className="w-4 h-4" /> Add Participant</Button>
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingId ? "Edit Participant" : "Add Participant"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Full Name *"
            required
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            placeholder="As per ID card"
          />
          <Select
            label="Gender *"
            required
            value={form.gender}
            onChange={(e) => setForm({ ...form, gender: e.target.value })}
            options={[
              { value: "MALE", label: "Male" },
              { value: "FEMALE", label: "Female" },
            ]}
          />
          <Input
            label="Birth Date"
            type="date"
            value={form.birthDate}
            onChange={(e) => setForm({ ...form, birthDate: e.target.value })}
          />
          <KTPInput
            label="ID Number (KTP)"
            value={form.idNumber}
            onChange={(val) => setForm({ ...form, idNumber: val })}
            hint="16 digits, cannot start with 0"
          />
          <PhoneInput
            label="Phone Number"
            value={form.phone}
            onChange={(val) => setForm({ ...form, phone: val })}
          />
          <Input
            label="Domicile"
            value={form.domicile}
            onChange={(e) => setForm({ ...form, domicile: e.target.value })}
            placeholder="e.g., Jakarta"
          />
          <Input
            label="Health History / Allergies"
            value={form.healthHistory}
            onChange={(e) => setForm({ ...form, healthHistory: e.target.value })}
            placeholder="Any medical conditions"
          />
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" loading={submitting}>
              <Save className="w-4 h-4" /> Save
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Participant">
        <p className="text-slate-600 mb-6">Are you sure you want to delete this participant? This action cannot be undone.</p>
        <div className="flex gap-3">
          <Button type="button" variant="outline" className="flex-1" onClick={() => setDeleteId(null)}>
            Cancel
          </Button>
          <Button type="button" variant="danger" className="flex-1" onClick={handleDelete} loading={submitting}>
            <Trash2 className="w-4 h-4" /> Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
}
