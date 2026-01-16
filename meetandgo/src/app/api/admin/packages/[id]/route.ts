import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

// GET /api/admin/packages/[id] - Get package details for editing
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const tourPackage = await prisma.tourPackage.findUnique({
      where: { id },
      include: {
        highlights: { orderBy: { order: "asc" } },
        itineraries: {
          orderBy: { day: "asc" },
          include: { activities: { orderBy: { order: "asc" } } },
        },
        meetingPoints: { orderBy: { order: "asc" } },
        departures: {
          orderBy: { departureDate: "asc" },
          include: {
            groups: { orderBy: { groupNumber: "asc" } },
            _count: { select: { bookings: true } },
          },
        },
      },
    });

    if (!tourPackage) {
      return NextResponse.json({ error: "Package not found" }, { status: 404 });
    }

    return NextResponse.json(tourPackage);
  } catch (error) {
    console.error("Get package error:", error);
    return NextResponse.json({ error: "Failed to fetch package" }, { status: 500 });
  }
}

// PUT /api/admin/packages/[id] - Update package
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const {
      title,
      tripType,
      location,
      description,
      duration,
      durationDays,
      thumbnail,
      isActive,
      highlights,
      itineraries,
      includedItems,
      excludedItems,
      meetingPoints,
      departures,
    } = body;

    // Verify package exists
    const existingPackage = await prisma.tourPackage.findUnique({
      where: { id },
      include: {
        departures: {
          include: {
            _count: { select: { bookings: true } },
            groups: true,
          },
        },
      },
    });

    if (!existingPackage) {
      return NextResponse.json({ error: "Package not found" }, { status: 404 });
    }

    // Generate slug from title if title changed
    let slug = existingPackage.slug;
    if (title !== existingPackage.title) {
      slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      // Check for duplicate slug
      const existingSlug = await prisma.tourPackage.findFirst({
        where: { slug, id: { not: id } },
      });
      if (existingSlug) {
        slug = `${slug}-${Date.now()}`;
      }
    }

    // Update package with transaction
    const updatedPackage = await prisma.$transaction(async (tx) => {
      // Update basic info
      const pkg = await tx.tourPackage.update({
        where: { id },
        data: {
          title,
          slug,
          tripType,
          location,
          description,
          duration,
          durationDays,
          thumbnail: thumbnail || null,
          isActive,
          includedItems,
          excludedItems,
        },
      });

      // Update highlights - delete and recreate
      await tx.highlight.deleteMany({ where: { tourPackageId: id } });
      if (highlights && highlights.length > 0) {
        await tx.highlight.createMany({
          data: highlights.map((h: any, index: number) => ({
            tourPackageId: id,
            title: h.title,
            description: h.description || null,
            image: h.image || null,
            order: h.order ?? index,
          })),
        });
      }

      // Update itineraries - delete activities first, then itineraries, then recreate
      const existingItineraries = await tx.itinerary.findMany({
        where: { tourPackageId: id },
        select: { id: true },
      });
      for (const it of existingItineraries) {
        await tx.itineraryActivity.deleteMany({ where: { itineraryId: it.id } });
      }
      await tx.itinerary.deleteMany({ where: { tourPackageId: id } });
      
      if (itineraries && itineraries.length > 0) {
        for (const it of itineraries) {
          const newItinerary = await tx.itinerary.create({
            data: {
              tourPackageId: id,
              day: it.day,
              title: it.title || null,
            },
          });
          if (it.activities && it.activities.length > 0) {
            await tx.itineraryActivity.createMany({
              data: it.activities.map((a: any, index: number) => ({
                itineraryId: newItinerary.id,
                startTime: a.startTime,
                endTime: a.endTime,
                activity: a.activity,
                description: a.description || null,
                order: a.order ?? index,
              })),
            });
          }
        }
      }

      // Update meeting points - delete and recreate
      await tx.meetingPoint.deleteMany({ where: { tourPackageId: id } });
      if (meetingPoints && meetingPoints.length > 0) {
        await tx.meetingPoint.createMany({
          data: meetingPoints.map((m: any, index: number) => ({
            tourPackageId: id,
            name: m.name,
            address: m.address || null,
            time: m.time || null,
            order: m.order ?? index,
          })),
        });
      }

      // Update departures - more careful handling to preserve bookings
      const existingDepartureIds = existingPackage.departures.map(d => d.id);
      const newDepartureIds = departures.filter((d: any) => d.id).map((d: any) => d.id);
      
      // Find departures to delete (only if no bookings)
      for (const existingDep of existingPackage.departures) {
        if (!newDepartureIds.includes(existingDep.id)) {
          if (existingDep._count.bookings > 0) {
            throw new Error(`Cannot delete departure with existing bookings`);
          }
          // Delete groups first
          await tx.departureGroup.deleteMany({ where: { departureId: existingDep.id } });
          await tx.departure.delete({ where: { id: existingDep.id } });
        }
      }

      // Update or create departures
      for (const dep of departures) {
        if (dep.id && existingDepartureIds.includes(dep.id)) {
          // Update existing departure
          await tx.departure.update({
            where: { id: dep.id },
            data: {
              departureDate: new Date(dep.departureDate),
              pricePerPerson: tripType === "OPEN_TRIP" ? dep.pricePerPerson : null,
              maxParticipants: tripType === "OPEN_TRIP" ? dep.maxParticipants : null,
            },
          });

          // Handle groups for private trips
          if (tripType === "PRIVATE_TRIP") {
            const existingDep = existingPackage.departures.find(d => d.id === dep.id);
            const existingGroupIds = existingDep?.groups.map(g => g.id) || [];
            const newGroupIds = dep.groups.filter((g: any) => g.id).map((g: any) => g.id);

            // Delete removed groups (only if not booked)
            for (const existingGroup of existingDep?.groups || []) {
              if (!newGroupIds.includes(existingGroup.id)) {
                if (existingGroup.isBooked) {
                  throw new Error(`Cannot delete booked group`);
                }
                await tx.departureGroup.delete({ where: { id: existingGroup.id } });
              }
            }

            // Update or create groups
            for (const g of dep.groups) {
              if (g.id && existingGroupIds.includes(g.id)) {
                await tx.departureGroup.update({
                  where: { id: g.id },
                  data: {
                    groupNumber: g.groupNumber,
                    price: g.price,
                    maxParticipants: g.maxParticipants,
                  },
                });
              } else {
                await tx.departureGroup.create({
                  data: {
                    departureId: dep.id,
                    groupNumber: g.groupNumber,
                    price: g.price,
                    maxParticipants: g.maxParticipants,
                  },
                });
              }
            }
          } else {
            // Clear groups for open trips
            await tx.departureGroup.deleteMany({ where: { departureId: dep.id } });
          }
        } else {
          // Create new departure
          const newDeparture = await tx.departure.create({
            data: {
              tourPackageId: id,
              departureDate: new Date(dep.departureDate),
              pricePerPerson: tripType === "OPEN_TRIP" ? dep.pricePerPerson : null,
              maxParticipants: tripType === "OPEN_TRIP" ? dep.maxParticipants : null,
            },
          });

          // Create groups for private trips
          if (tripType === "PRIVATE_TRIP" && dep.groups && dep.groups.length > 0) {
            await tx.departureGroup.createMany({
              data: dep.groups.map((g: any) => ({
                departureId: newDeparture.id,
                groupNumber: g.groupNumber,
                price: g.price,
                maxParticipants: g.maxParticipants,
              })),
            });
          }
        }
      }

      return pkg;
    });

    return NextResponse.json(updatedPackage);
  } catch (error) {
    console.error("Update package error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update package" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/packages/[id] - Delete package (only if no bookings)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Check for existing bookings
    const bookingsCount = await prisma.booking.count({
      where: { departure: { tourPackageId: id } },
    });

    if (bookingsCount > 0) {
      return NextResponse.json(
        { error: "Cannot delete package with existing bookings" },
        { status: 400 }
      );
    }

    // Delete package and all related data
    await prisma.$transaction(async (tx) => {
      // Delete departure groups
      const departures = await tx.departure.findMany({
        where: { tourPackageId: id },
        select: { id: true },
      });
      for (const dep of departures) {
        await tx.departureGroup.deleteMany({ where: { departureId: dep.id } });
      }
      
      // Delete departures
      await tx.departure.deleteMany({ where: { tourPackageId: id } });
      
      // Delete itinerary activities
      const itineraries = await tx.itinerary.findMany({
        where: { tourPackageId: id },
        select: { id: true },
      });
      for (const it of itineraries) {
        await tx.itineraryActivity.deleteMany({ where: { itineraryId: it.id } });
      }
      
      // Delete itineraries
      await tx.itinerary.deleteMany({ where: { tourPackageId: id } });
      
      // Delete highlights
      await tx.highlight.deleteMany({ where: { tourPackageId: id } });
      
      // Delete meeting points
      await tx.meetingPoint.deleteMany({ where: { tourPackageId: id } });
      
      // Delete package
      await tx.tourPackage.delete({ where: { id } });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete package error:", error);
    return NextResponse.json({ error: "Failed to delete package" }, { status: 500 });
  }
}
