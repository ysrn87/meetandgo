import { prisma } from "@/lib/db";
import type { Participant, ParticipantWithBookings, ParticipantFormData } from "@/types";

export async function getParticipantsByUser(userId: string): Promise<ParticipantWithBookings[]> {
  return prisma.participant.findMany({
    where: { userId },
    include: { bookings: { include: { booking: { select: { id: true, bookingCode: true, status: true } } } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function getParticipantById(id: string): Promise<Participant | null> {
  return prisma.participant.findUnique({ where: { id } });
}

export async function createParticipant(userId: string, data: ParticipantFormData): Promise<Participant> {
  return prisma.participant.create({
    data: {
      userId,
      fullName: data.fullName,
      idNumber: data.idNumber || null,
      gender: data.gender,
      birthPlace: data.birthPlace || null,
      birthDate: data.birthDate ? new Date(data.birthDate) : null,
      phone: data.phone || null,
      domicile: data.domicile || null,
      email: data.email || null,
      address: data.address || null,
      healthHistory: data.healthHistory || null,
      ktpImage: data.ktpImage || null,
    },
  });
}

export async function updateParticipant(id: string, userId: string, data: Partial<ParticipantFormData>): Promise<Participant> {
  const participant = await prisma.participant.findUnique({ where: { id } });
  if (!participant) throw new Error("Participant not found");
  if (participant.userId !== userId) throw new Error("Unauthorized");

  return prisma.participant.update({
    where: { id },
    data: {
      ...(data.fullName && { fullName: data.fullName }),
      ...(data.idNumber !== undefined && { idNumber: data.idNumber || null }),
      ...(data.gender && { gender: data.gender }),
      ...(data.birthPlace !== undefined && { birthPlace: data.birthPlace || null }),
      ...(data.birthDate !== undefined && { birthDate: data.birthDate ? new Date(data.birthDate) : null }),
      ...(data.phone !== undefined && { phone: data.phone || null }),
      ...(data.domicile !== undefined && { domicile: data.domicile || null }),
      ...(data.email !== undefined && { email: data.email || null }),
      ...(data.address !== undefined && { address: data.address || null }),
      ...(data.healthHistory !== undefined && { healthHistory: data.healthHistory || null }),
      ...(data.ktpImage !== undefined && { ktpImage: data.ktpImage || null }),
    },
  });
}

export async function deleteParticipant(id: string, userId: string): Promise<void> {
  const participant = await prisma.participant.findUnique({ where: { id }, include: { bookings: true } });
  if (!participant) throw new Error("Participant not found");
  if (participant.userId !== userId) throw new Error("Unauthorized");
  if (participant.bookings.length > 0) throw new Error("Cannot delete participant with bookings");
  await prisma.participant.delete({ where: { id } });
}

export async function createOrGetParticipants(userId: string, participants: ParticipantFormData[]): Promise<string[]> {
  const ids: string[] = [];

  for (const p of participants) {
    if (p.id) {
      const existing = await prisma.participant.findUnique({ where: { id: p.id } });
      if (existing && existing.userId === userId) {
        ids.push(existing.id);
        continue;
      }
    }

    const created = await createParticipant(userId, p);
    ids.push(created.id);
  }

  return ids;
}
