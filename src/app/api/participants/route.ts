import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const participants = await prisma.participant.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: participants });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch participants" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const data = await request.json();

    const participant = await prisma.participant.create({
      data: {
        userId: user.id,
        fullName: data.fullName,
        gender: data.gender,
        birthDate: data.birthDate ? new Date(data.birthDate) : undefined,
        idNumber: data.idNumber,
        phone: data.phone,
        domicile: data.domicile,
        healthHistory: data.healthHistory,
      },
    });

    return NextResponse.json({ success: true, data: participant });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to create participant" }, { status: 500 });
  }
}
