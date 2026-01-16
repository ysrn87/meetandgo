import { prisma } from "@/lib/db";
import { generateRequestCode } from "@/lib/utils";
import type { CustomRequestWithRelations } from "@/types";
import { CustomRequestStatus } from "@prisma/client";

export async function createCustomRequest(data: { userId: string; destination: string; duration: string; departureDate: string; meetingPoint: string; participantCount: number; notes?: string }): Promise<CustomRequestWithRelations> {
  return prisma.customTourRequest.create({
    data: {
      requestCode: generateRequestCode(),
      userId: data.userId,
      destination: data.destination,
      duration: data.duration,
      departureDate: new Date(data.departureDate),
      meetingPoint: data.meetingPoint,
      participantCount: data.participantCount,
      notes: data.notes,
    },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true } },
      tourGuide: { select: { id: true, name: true, email: true, phone: true } },
    },
  });
}

export async function getCustomRequestsByUser(userId: string): Promise<CustomRequestWithRelations[]> {
  return prisma.customTourRequest.findMany({
    where: { userId },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true } },
      tourGuide: { select: { id: true, name: true, email: true, phone: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getCustomRequestById(id: string): Promise<CustomRequestWithRelations | null> {
  return prisma.customTourRequest.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true } },
      tourGuide: { select: { id: true, name: true, email: true, phone: true } },
      priceHistory: { orderBy: { createdAt: "desc" } },
    },
  });
}

export async function getAllCustomRequests(options?: { status?: CustomRequestStatus; limit?: number; offset?: number }): Promise<{ requests: CustomRequestWithRelations[]; total: number }> {
  const where = options?.status ? { status: options.status } : {};
  const [requests, total] = await Promise.all([
    prisma.customTourRequest.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        tourGuide: { select: { id: true, name: true, email: true, phone: true } },
      },
      orderBy: { createdAt: "desc" },
      take: options?.limit,
      skip: options?.offset,
    }),
    prisma.customTourRequest.count({ where }),
  ]);
  return { requests, total };
}

const STATUS_FLOW: CustomRequestStatus[] = ["PENDING", "IN_REVIEW", "ACCEPTED", "PAID", "PROCESSED", "ONGOING", "COMPLETED"];

export async function updateCustomRequestStatus(id: string, data: { status: CustomRequestStatus; estimatedPrice?: number; finalPrice?: number; tourGuideId?: string; adminNotes?: string }): Promise<CustomRequestWithRelations> {
  const request = await prisma.customTourRequest.findUnique({ where: { id } });
  if (!request) throw new Error("Request not found");
  if (request.status === "CANCELLED" || request.status === "REJECTED") throw new Error("Cannot update cancelled or rejected request");

  const currentIndex = STATUS_FLOW.indexOf(request.status);
  const newIndex = STATUS_FLOW.indexOf(data.status);
  if (newIndex < currentIndex && data.status !== "REJECTED") throw new Error("Status cannot be reverted");

  if (data.status === "ACCEPTED" && !data.finalPrice) throw new Error("Final price required when accepting");
  if (data.status === "ONGOING" && !data.tourGuideId) throw new Error("Tour guide required when status is ongoing");

  return prisma.$transaction(async (tx) => {
    if (data.estimatedPrice && data.status === "IN_REVIEW") {
      await tx.priceEstimateHistory.create({ data: { requestId: id, estimatedPrice: data.estimatedPrice, notes: data.adminNotes } });
    }

    return tx.customTourRequest.update({
      where: { id },
      data: {
        status: data.status,
        ...(data.estimatedPrice && { estimatedPrice: data.estimatedPrice }),
        ...(data.finalPrice && { finalPrice: data.finalPrice }),
        ...(data.tourGuideId && { tourGuideId: data.tourGuideId }),
        ...(data.adminNotes !== undefined && { adminNotes: data.adminNotes }),
      },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        tourGuide: { select: { id: true, name: true, email: true, phone: true } },
      },
    });
  });
}
