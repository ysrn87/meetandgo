import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateBookingCode, getPaymentDeadline } from "@/lib/utils";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    const { packageId, departureId, departureGroupId, participantCount, participants, notes } = data;

    // Fetch departure and package info
    const departure = await prisma.departure.findUnique({
      where: { id: departureId },
      include: {
        tourPackage: true,
        groups: departureGroupId ? { where: { id: departureGroupId } } : false,
        _count: { select: { bookings: { where: { status: { notIn: ["CANCELLED", "EXPIRED"] } } } } },
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
      // Process participants - find existing or create new
      const participantRecords = await Promise.all(
        participants.map(async (p: any, index: number) => {
          let participantId = p.id;

          // If participant has an ID (selected from saved), verify it belongs to user
          if (participantId) {
            const existing = await tx.participant.findFirst({
              where: { id: participantId, userId: user.id },
            });
            if (existing) {
              // Update existing participant with any new data
              await tx.participant.update({
                where: { id: participantId },
                data: {
                  fullName: p.fullName || existing.fullName,
                  gender: p.gender || existing.gender,
                  birthDate: p.birthDate ? new Date(p.birthDate) : existing.birthDate,
                  phone: p.phone || existing.phone,
                  domicile: p.domicile || existing.domicile,
                  healthHistory: p.healthHistory || existing.healthHistory,
                },
              });
              return { participantId, isPrimary: index === 0 };
            }
          }

          // Check if participant with same ID number (KTP) already exists for this user
          if (p.idNumber && p.idNumber.trim() !== "") {
            const existingByIdNumber = await tx.participant.findFirst({
              where: {
                userId: user.id,
                idNumber: p.idNumber.trim(),
              },
            });

            if (existingByIdNumber) {
              // Update existing participant with new data
              await tx.participant.update({
                where: { id: existingByIdNumber.id },
                data: {
                  fullName: p.fullName || existingByIdNumber.fullName,
                  gender: p.gender || existingByIdNumber.gender,
                  birthDate: p.birthDate ? new Date(p.birthDate) : existingByIdNumber.birthDate,
                  phone: p.phone || existingByIdNumber.phone,
                  domicile: p.domicile || existingByIdNumber.domicile,
                  healthHistory: p.healthHistory || existingByIdNumber.healthHistory,
                },
              });
              return { participantId: existingByIdNumber.id, isPrimary: index === 0 };
            }
          }

          // Check if participant with same name and birth date exists (for cases without ID number)
          if (p.fullName && p.birthDate) {
            const existingByNameDob = await tx.participant.findFirst({
              where: {
                userId: user.id,
                fullName: p.fullName.trim(),
                birthDate: new Date(p.birthDate),
              },
            });

            if (existingByNameDob) {
              // Update existing participant
              await tx.participant.update({
                where: { id: existingByNameDob.id },
                data: {
                  gender: p.gender || existingByNameDob.gender,
                  idNumber: p.idNumber || existingByNameDob.idNumber,
                  phone: p.phone || existingByNameDob.phone,
                  domicile: p.domicile || existingByNameDob.domicile,
                  healthHistory: p.healthHistory || existingByNameDob.healthHistory,
                },
              });
              return { participantId: existingByNameDob.id, isPrimary: index === 0 };
            }
          }

          // Create new participant
          const newParticipant = await tx.participant.create({
            data: {
              userId: user.id,
              fullName: p.fullName,
              gender: p.gender,
              birthDate: p.birthDate ? new Date(p.birthDate) : undefined,
              idNumber: p.idNumber?.trim() || undefined,
              phone: p.phone || undefined,
              domicile: p.domicile || undefined,
              healthHistory: p.healthHistory || undefined,
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
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

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