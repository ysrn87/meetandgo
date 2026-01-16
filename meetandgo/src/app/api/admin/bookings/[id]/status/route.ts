import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { BOOKING_STATUS_FLOW } from "@/types";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const { status } = await request.json();

    const booking = await prisma.booking.findUnique({ where: { id } });
    if (!booking) return NextResponse.json({ success: false, error: "Booking not found" }, { status: 404 });

    const currentIndex = BOOKING_STATUS_FLOW.indexOf(booking.status as typeof BOOKING_STATUS_FLOW[number]);
    const newIndex = BOOKING_STATUS_FLOW.indexOf(status);

    if (newIndex <= currentIndex) {
      return NextResponse.json({ success: false, error: "Cannot revert to previous status" }, { status: 400 });
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: {
        status,
        ...(status === "PAYMENT_RECEIVED" && { paidAt: new Date() }),
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update status";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
