import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const participants = await prisma.participant.findMany({
      where: { userId: user.id },
      orderBy: { fullName: "asc" },
    });

    return NextResponse.json({ success: true, data: participants });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch participants" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    const { fullName, gender, birthDate, idNumber, phone, domicile, healthHistory } = data;

    if (!fullName || !fullName.trim()) {
      return NextResponse.json({ success: false, error: "Full name is required" }, { status: 400 });
    }

    // Check for duplicate by ID number (KTP)
    if (idNumber && idNumber.trim() !== "") {
      const existingByIdNumber = await prisma.participant.findFirst({
        where: {
          userId: user.id,
          idNumber: idNumber.trim(),
        },
      });

      if (existingByIdNumber) {
        // Update existing participant instead of creating duplicate
        const updated = await prisma.participant.update({
          where: { id: existingByIdNumber.id },
          data: {
            fullName: fullName.trim(),
            gender: gender || existingByIdNumber.gender,
            birthDate: birthDate ? new Date(birthDate) : existingByIdNumber.birthDate,
            phone: phone || existingByIdNumber.phone,
            domicile: domicile || existingByIdNumber.domicile,
            healthHistory: healthHistory || existingByIdNumber.healthHistory,
          },
        });

        return NextResponse.json({ 
          success: true, 
          data: updated,
          message: "Participant updated (ID number already exists)" 
        });
      }
    }

    // Check for duplicate by name and birth date
    if (birthDate) {
      const existingByNameDob = await prisma.participant.findFirst({
        where: {
          userId: user.id,
          fullName: fullName.trim(),
          birthDate: new Date(birthDate),
        },
      });

      if (existingByNameDob) {
        // Update existing participant
        const updated = await prisma.participant.update({
          where: { id: existingByNameDob.id },
          data: {
            gender: gender || existingByNameDob.gender,
            idNumber: idNumber?.trim() || existingByNameDob.idNumber,
            phone: phone || existingByNameDob.phone,
            domicile: domicile || existingByNameDob.domicile,
            healthHistory: healthHistory || existingByNameDob.healthHistory,
          },
        });

        return NextResponse.json({ 
          success: true, 
          data: updated,
          message: "Participant updated (name and birth date match)" 
        });
      }
    }

    // Create new participant
    const participant = await prisma.participant.create({
      data: {
        userId: user.id,
        fullName: fullName.trim(),
        gender: gender || "MALE",
        birthDate: birthDate ? new Date(birthDate) : undefined,
        idNumber: idNumber?.trim() || undefined,
        phone: phone || undefined,
        domicile: domicile || undefined,
        healthHistory: healthHistory || undefined,
      },
    });

    return NextResponse.json({ success: true, data: participant });
  } catch (error) {
    console.error("Create participant error:", error);
    return NextResponse.json({ success: false, error: "Failed to create participant" }, { status: 500 });
  }
}