import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { CUSTOM_REQUEST_STATUS_FLOW } from "@/types";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const { status, estimatedPrice, finalPrice, tourGuideId, adminNotes } = await request.json();

    const existing = await prisma.customTourRequest.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ success: false, error: "Request not found" }, { status: 404 });

    const currentIndex = CUSTOM_REQUEST_STATUS_FLOW.indexOf(existing.status as typeof CUSTOM_REQUEST_STATUS_FLOW[number]);
    const newIndex = CUSTOM_REQUEST_STATUS_FLOW.indexOf(status);

    if (newIndex < currentIndex && newIndex !== -1) {
      return NextResponse.json({ success: false, error: "Cannot revert to previous status" }, { status: 400 });
    }

    if (status === "ACCEPTED" && !finalPrice && !existing.finalPrice) {
      return NextResponse.json({ success: false, error: "Final price required for acceptance" }, { status: 400 });
    }

    if (status === "ONGOING" && !tourGuideId && !existing.tourGuideId) {
      return NextResponse.json({ success: false, error: "Tour guide required for ongoing status" }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (status && status !== existing.status) updateData.status = status;
    if (finalPrice) updateData.finalPrice = finalPrice;
    if (tourGuideId) updateData.tourGuideId = tourGuideId;
    if (adminNotes) updateData.adminNotes = adminNotes;

    if (estimatedPrice && existing.status === "IN_REVIEW") {
      updateData.estimatedPrice = estimatedPrice;
      await prisma.priceEstimateHistory.create({
        data: { requestId: id, estimatedPrice, notes: adminNotes },
      });
    }

    const updated = await prisma.customTourRequest.update({ where: { id }, data: updateData });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update request";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
