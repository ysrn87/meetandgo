import { prisma } from "@/lib/db";
import { slugify } from "@/lib/utils";
import type { TourPackageWithRelations, TourPackageCard, TourPackageFormData } from "@/types";
import { TripType } from "@prisma/client";

export async function getPackages(options?: {
  tripType?: TripType;
  location?: string;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<{ packages: TourPackageCard[]; total: number }> {
  const where = {
    isActive: true,
    ...(options?.tripType && { tripType: options.tripType }),
    ...(options?.location && {
      location: { contains: options.location, mode: "insensitive" as const },
    }),
    ...(options?.search && {
      OR: [
        { title: { contains: options.search, mode: "insensitive" as const } },
        { location: { contains: options.search, mode: "insensitive" as const } },
      ],
    }),
  };

  const [packages, total] = await Promise.all([
    prisma.tourPackage.findMany({
      where,
      select: {
        id: true,
        slug: true,
        title: true,
        thumbnail: true,
        location: true,
        duration: true,
        tripType: true,
        highlights: { select: { id: true, title: true }, take: 3, orderBy: { order: "asc" } },
        departures: {
          where: { isActive: true, departureDate: { gte: new Date() } },
          select: { id: true, departureDate: true, pricePerPerson: true },
          orderBy: { departureDate: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
      take: options?.limit,
      skip: options?.offset,
    }),
    prisma.tourPackage.count({ where }),
  ]);

  const packagesWithPrice = packages.map((pkg) => {
    let minPrice: number | null = null;
    if (pkg.tripType === "OPEN_TRIP") {
      const prices = pkg.departures.filter((d) => d.pricePerPerson).map((d) => Number(d.pricePerPerson));
      minPrice = prices.length > 0 ? Math.min(...prices) : null;
    }
    return { ...pkg, minPrice };
  });

  return { packages: packagesWithPrice, total };
}

export async function getPackageBySlug(slug: string): Promise<TourPackageWithRelations | null> {
  return prisma.tourPackage.findUnique({
    where: { slug },
    include: {
      highlights: { orderBy: { order: "asc" } },
      itineraries: { orderBy: { day: "asc" }, include: { activities: { orderBy: { order: "asc" } } } },
      includedItems: { orderBy: { order: "asc" } },
      excludedItems: { orderBy: { order: "asc" } },
      meetingPoints: { orderBy: { order: "asc" } },
      departures: {
        where: { isActive: true, departureDate: { gte: new Date() } },
        orderBy: { departureDate: "asc" },
        include: { groups: { orderBy: { groupNumber: "asc" } }, _count: { select: { bookings: true } } },
      },
    },
  });
}

export async function getPackageById(id: string): Promise<TourPackageWithRelations | null> {
  return prisma.tourPackage.findUnique({
    where: { id },
    include: {
      highlights: { orderBy: { order: "asc" } },
      itineraries: { orderBy: { day: "asc" }, include: { activities: { orderBy: { order: "asc" } } } },
      includedItems: { orderBy: { order: "asc" } },
      excludedItems: { orderBy: { order: "asc" } },
      meetingPoints: { orderBy: { order: "asc" } },
      departures: {
        orderBy: { departureDate: "asc" },
        include: { groups: { orderBy: { groupNumber: "asc" } }, _count: { select: { bookings: true } } },
      },
    },
  });
}

export async function createPackage(data: TourPackageFormData): Promise<TourPackageWithRelations> {
  const slug = slugify(data.title);
  const existing = await prisma.tourPackage.findUnique({ where: { slug } });
  const finalSlug = existing ? `${slug}-${Date.now()}` : slug;

  return prisma.tourPackage.create({
    data: {
      title: data.title,
      slug: finalSlug,
      tripType: data.tripType,
      location: data.location,
      description: data.description,
      duration: data.duration,
      durationDays: data.durationDays,
      thumbnail: data.thumbnail,
      images: data.images || [],
      highlights: { create: data.highlights.map((h, i) => ({ title: h.title, description: h.description, image: h.image, order: h.order ?? i })) },
      itineraries: {
        create: data.itineraries.map((it) => ({
          day: it.day,
          title: it.title,
          activities: { create: it.activities.map((act, i) => ({ startTime: act.startTime, endTime: act.endTime, activity: act.activity, description: act.description, order: act.order ?? i })) },
        })),
      },
      includedItems: { create: data.includedItems.map((item, i) => ({ item, order: i })) },
      excludedItems: { create: data.excludedItems.map((item, i) => ({ item, order: i })) },
      meetingPoints: { create: data.meetingPoints.map((mp, i) => ({ name: mp.name, address: mp.address, time: mp.time, order: mp.order ?? i })) },
      departures: {
        create: data.departures.map((dep) => ({
          departureDate: new Date(dep.departureDate),
          pricePerPerson: dep.pricePerPerson,
          maxParticipants: dep.maxParticipants,
          groups: dep.groups ? { create: dep.groups.map((g) => ({ groupNumber: g.groupNumber, price: g.price, maxParticipants: g.maxParticipants })) } : undefined,
        })),
      },
    },
    include: {
      highlights: { orderBy: { order: "asc" } },
      itineraries: { orderBy: { day: "asc" }, include: { activities: { orderBy: { order: "asc" } } } },
      includedItems: { orderBy: { order: "asc" } },
      excludedItems: { orderBy: { order: "asc" } },
      meetingPoints: { orderBy: { order: "asc" } },
      departures: { orderBy: { departureDate: "asc" }, include: { groups: { orderBy: { groupNumber: "asc" } }, _count: { select: { bookings: true } } } },
    },
  });
}

export async function deletePackage(id: string): Promise<void> {
  const hasBookings = await prisma.booking.findFirst({
    where: { departure: { tourPackageId: id }, status: { notIn: ["CANCELLED", "EXPIRED", "COMPLETED"] } },
  });
  if (hasBookings) throw new Error("Cannot delete package with active bookings");
  await prisma.tourPackage.update({ where: { id }, data: { isActive: false } });
}

export async function addDeparture(packageId: string, data: { departureDate: string; pricePerPerson?: number; maxParticipants?: number; groups?: { groupNumber: number; price: number; maxParticipants: number }[] }) {
  const departureDate = new Date(data.departureDate);
  if (departureDate < new Date()) throw new Error("Departure date cannot be in the past");
  return prisma.departure.create({
    data: {
      tourPackageId: packageId,
      departureDate,
      pricePerPerson: data.pricePerPerson,
      maxParticipants: data.maxParticipants,
      groups: data.groups ? { create: data.groups.map((g) => ({ groupNumber: g.groupNumber, price: g.price, maxParticipants: g.maxParticipants })) } : undefined,
    },
    include: { groups: { orderBy: { groupNumber: "asc" } } },
  });
}
