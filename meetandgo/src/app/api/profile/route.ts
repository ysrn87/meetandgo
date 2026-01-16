import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const data = await request.json();
    const { name, email, phone } = data;

    if (!email && !phone) {
      return NextResponse.json({ success: false, error: "Email or phone is required" }, { status: 400 });
    }

    // Check for duplicate email/phone
    if (email) {
      const existingEmail = await prisma.user.findFirst({
        where: { email, id: { not: user.id } },
      });
      if (existingEmail) {
        return NextResponse.json({ success: false, error: "Email already in use" }, { status: 400 });
      }
    }

    if (phone) {
      const existingPhone = await prisma.user.findFirst({
        where: { phone, id: { not: user.id } },
      });
      if (existingPhone) {
        return NextResponse.json({ success: false, error: "Phone already in use" }, { status: 400 });
      }
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        name,
        email: email || null,
        phone: phone || null,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to update profile" }, { status: 500 });
  }
}
