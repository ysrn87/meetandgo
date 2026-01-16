import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateBookingCode, getPaymentDeadline } from "@/lib/utils";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const data = await request.json();
    const { packageId, departureId, departureGroupId, participantCount, participants, notes } = data;

    // Fetch departure and package info
    const departure = await prisma.departure.findUnique({
      where: { id: departureId },
      include: {
        tourPackage: true,
        groups: departureGroupId ? { where: { id: departureGroupId } } : false,
        _count: { select: { bookings: true } },
      },
    });

    if (!departure) {
      return NextResponse.json({ success: false, error: "Departure not found" }, { status: 404 });
    }

    const isOpenTrip = departure.tourPackage.tripType === "OPEN_TRIP";
    const isPrivateTrip = departure.tourPackage.tripType === "PRIVATE_TRIP";

    // Validate availability
    if (isOpenTrip) {
      if (departure.maxParticipants) {
        const currentBookings = departure._count.bookings;
        if (currentBookings + participantCount > departure.maxParticipants) {
          return NextResponse.json({ success: false, error: "Not enough spots available" }, { status: 400 });
        }
      }
    }

    if (isPrivateTrip && departureGroupId) {
      const group = await prisma.departureGroup.findUnique({ where: { id: departureGroupId } });
      if (!group) {
        return NextResponse.json({ success: false, error: "Group not found" }, { status: 404 });
      }
      if (group.isBooked) {
        return NextResponse.json({ success: false, error: "Group is already booked" }, { status: 400 });
      }
    }

    // Calculate total
    let totalAmount = 0;
    if (isOpenTrip && departure.pricePerPerson) {
      totalAmount = Number(departure.pricePerPerson) * participantCount;
    }
    if (isPrivateTrip && departureGroupId) {
      const group = departure.groups && departure.groups[0];
      if (group) {
        totalAmount = Number(group.price);
      }
    }

    // Create booking with participants
    const booking = await prisma.$transaction(async (tx) => {
      // Create or get participants
      const participantRecords = await Promise.all(
        participants.map(async (p: any, index: number) => {
          if (p.id) {
            // Use existing participant
            return { participantId: p.id, isPrimary: index === 0 };
          }
          // Create new participant
          const newParticipant = await tx.participant.create({
            data: {
              userId: user.id,
              fullName: p.fullName,
              gender: p.gender,
              birthDate: p.birthDate ? new Date(p.birthDate) : undefined,
              idNumber: p.idNumber,
              phone: p.phone,
              domicile: p.domicile,
              healthHistory: p.healthHistory,
            },
          });
          return { participantId: newParticipant.id, isPrimary: index === 0 };
        })
      );

      // Create booking
      const newBooking = await tx.booking.create({
        data: {
          bookingCode: generateBookingCode(),
          userId: user.id,
          departureId,
          departureGroupId: isPrivateTrip ? departureGroupId : undefined,
          tripType: departure.tourPackage.tripType,
          totalAmount,
          participantCount: participants.length,
          paymentDeadline: getPaymentDeadline(),
          notes,
          participants: {
            create: participantRecords,
          },
        },
        include: {
          participants: { include: { participant: true } },
        },
      });

      // Mark group as booked for private trips
      if (isPrivateTrip && departureGroupId) {
        await tx.departureGroup.update({
          where: { id: departureGroupId },
          data: { isBooked: true },
        });
      }

      return newBooking;
    });

    return NextResponse.json({ success: true, data: booking });
  } catch (error) {
    console.error("Booking error:", error);
    return NextResponse.json({ success: false, error: "Failed to create booking" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const bookings = await prisma.booking.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        departure: {
          include: {
            tourPackage: { select: { title: true, slug: true, location: true } },
          },
        },
        _count: { select: { participants: true } },
      },
    });

    return NextResponse.json({ success: true, data: bookings });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch bookings" }, { status: 500 });
  }
}
