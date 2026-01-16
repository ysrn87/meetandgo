import { prisma } from "@/lib/db";
import { generateBookingCode, getPaymentDeadline } from "@/lib/utils";
import type { BookingWithRelations } from "@/types";
import { BookingStatus, TripType } from "@prisma/client";

export async function createBooking(data: {
  userId: string;
  departureId: string;
  departureGroupId?: string;
  participantIds: string[];
  notes?: string;
}): Promise<BookingWithRelations> {
  const departure = await prisma.departure.findUnique({
    where: { id: data.departureId },
    include: { tourPackage: true, groups: true },
  });

  if (!departure) throw new Error("Departure not found");

  const tripType = departure.tourPackage.tripType;
  let totalAmount = 0;

  if (tripType === "OPEN_TRIP") {
    if (!departure.pricePerPerson) throw new Error("Price not set");
    const bookedCount = await prisma.booking.count({
      where: { departureId: data.departureId, status: { notIn: ["CANCELLED", "EXPIRED"] } },
    });
    const availableSeats = (departure.maxParticipants || 0) - bookedCount;
    if (data.participantIds.length > availableSeats) throw new Error("Not enough seats available");
    totalAmount = Number(departure.pricePerPerson) * data.participantIds.length;
  } else {
    if (!data.departureGroupId) throw new Error("Group selection required for private trip");
    const group = departure.groups.find((g) => g.id === data.departureGroupId);
    if (!group) throw new Error("Group not found");
    if (group.isBooked) throw new Error("Group already booked");
    totalAmount = Number(group.price);
  }

  return prisma.$transaction(async (tx) => {
    const booking = await tx.booking.create({
      data: {
        bookingCode: generateBookingCode(),
        userId: data.userId,
        departureId: data.departureId,
        departureGroupId: data.departureGroupId,
        tripType,
        totalAmount,
        participantCount: data.participantIds.length,
        paymentDeadline: getPaymentDeadline(),
        notes: data.notes,
        participants: { create: data.participantIds.map((id, i) => ({ participantId: id, isPrimary: i === 0 })) },
      },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        departure: { include: { tourPackage: { select: { id: true, title: true, slug: true, thumbnail: true, location: true } } } },
        departureGroup: true,
        participants: { include: { participant: true } },
      },
    });

    if (tripType === "PRIVATE_TRIP" && data.departureGroupId) {
      await tx.departureGroup.update({ where: { id: data.departureGroupId }, data: { isBooked: true } });
    }

    return booking;
  });
}

export async function getBookingsByUser(userId: string): Promise<BookingWithRelations[]> {
  return prisma.booking.findMany({
    where: { userId },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true } },
      departure: { include: { tourPackage: { select: { id: true, title: true, slug: true, thumbnail: true, location: true } } } },
      departureGroup: true,
      participants: { include: { participant: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getBookingById(id: string): Promise<BookingWithRelations | null> {
  return prisma.booking.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true } },
      departure: { include: { tourPackage: { select: { id: true, title: true, slug: true, thumbnail: true, location: true } } } },
      departureGroup: true,
      participants: { include: { participant: true } },
    },
  });
}

export async function getBookingByCode(code: string): Promise<BookingWithRelations | null> {
  return prisma.booking.findUnique({
    where: { bookingCode: code },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true } },
      departure: { include: { tourPackage: { select: { id: true, title: true, slug: true, thumbnail: true, location: true } } } },
      departureGroup: true,
      participants: { include: { participant: true } },
    },
  });
}

export async function getAllBookings(options?: { status?: BookingStatus; limit?: number; offset?: number }): Promise<{ bookings: BookingWithRelations[]; total: number }> {
  const where = options?.status ? { status: options.status } : {};
  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        departure: { include: { tourPackage: { select: { id: true, title: true, slug: true, thumbnail: true, location: true } } } },
        departureGroup: true,
        participants: { include: { participant: true } },
      },
      orderBy: { createdAt: "desc" },
      take: options?.limit,
      skip: options?.offset,
    }),
    prisma.booking.count({ where }),
  ]);
  return { bookings, total };
}

const STATUS_FLOW: BookingStatus[] = ["PENDING", "PAYMENT_RECEIVED", "PROCESSED", "ONGOING", "COMPLETED"];

export async function updateBookingStatus(id: string, newStatus: BookingStatus): Promise<BookingWithRelations> {
  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking) throw new Error("Booking not found");
  if (booking.status === "CANCELLED" || booking.status === "EXPIRED") throw new Error("Cannot update cancelled or expired booking");

  const currentIndex = STATUS_FLOW.indexOf(booking.status);
  const newIndex = STATUS_FLOW.indexOf(newStatus);
  if (newIndex < currentIndex) throw new Error("Status cannot be reverted");

  const updateData: { status: BookingStatus; paidAt?: Date } = { status: newStatus };
  if (newStatus === "PAYMENT_RECEIVED" && !booking.paidAt) updateData.paidAt = new Date();

  return prisma.booking.update({
    where: { id },
    data: updateData,
    include: {
      user: { select: { id: true, name: true, email: true, phone: true } },
      departure: { include: { tourPackage: { select: { id: true, title: true, slug: true, thumbnail: true, location: true } } } },
      departureGroup: true,
      participants: { include: { participant: true } },
    },
  });
}

export async function expireOverdueBookings(): Promise<number> {
  const result = await prisma.booking.updateMany({
    where: { status: "PENDING", paymentDeadline: { lt: new Date() } },
    data: { status: "EXPIRED" },
  });

  const expiredBookings = await prisma.booking.findMany({
    where: { status: "EXPIRED", departureGroupId: { not: null } },
    select: { departureGroupId: true },
  });

  for (const booking of expiredBookings) {
    if (booking.departureGroupId) {
      await prisma.departureGroup.update({ where: { id: booking.departureGroupId }, data: { isBooked: false } });
    }
  }

  return result.count;
}

export async function cancelBooking(id: string, userId?: string): Promise<BookingWithRelations> {
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { departureGroup: true },
  });

  if (!booking) throw new Error("Booking not found");
  
  // If userId provided, verify ownership (for customer cancellation)
  if (userId && booking.userId !== userId) {
    throw new Error("You can only cancel your own bookings");
  }

  // Only PENDING bookings can be cancelled by customer
  if (userId && booking.status !== "PENDING") {
    throw new Error("Only pending bookings can be cancelled");
  }

  // Admin can cancel PENDING or PAYMENT_RECEIVED bookings
  if (!userId && !["PENDING", "PAYMENT_RECEIVED"].includes(booking.status)) {
    throw new Error("Cannot cancel booking with status: " + booking.status);
  }

  return prisma.$transaction(async (tx) => {
    // Update booking status
    const updatedBooking = await tx.booking.update({
      where: { id },
      data: { status: "CANCELLED" },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        departure: { include: { tourPackage: { select: { id: true, title: true, slug: true, thumbnail: true, location: true } } } },
        departureGroup: true,
        participants: { include: { participant: true } },
      },
    });

    // Release the group if it was a private trip
    if (booking.departureGroupId) {
      await tx.departureGroup.update({
        where: { id: booking.departureGroupId },
        data: { isBooked: false },
      });
    }

    return updatedBooking;
  });
}
