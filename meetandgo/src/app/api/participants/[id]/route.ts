import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const data = await request.json();

    const existing = await prisma.participant.findFirst({ where: { id, userId: user.id } });
    if (!existing) return NextResponse.json({ success: false, error: "Participant not found" }, { status: 404 });

    const participant = await prisma.participant.update({
      where: { id },
      data: {
        fullName: data.fullName,
        gender: data.gender,
        birthDate: data.birthDate ? new Date(data.birthDate) : null,
        idNumber: data.idNumber || null,
        phone: data.phone || null,
        domicile: data.domicile || null,
        healthHistory: data.healthHistory || null,
      },
    });

    return NextResponse.json({ success: true, data: participant });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to update participant" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    const existing = await prisma.participant.findFirst({ where: { id, userId: user.id } });
    if (!existing) return NextResponse.json({ success: false, error: "Participant not found" }, { status: 404 });

    await prisma.participant.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to delete participant" }, { status: 500 });
  }
}
