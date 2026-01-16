import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/db";
import { formatPrice } from "@/lib/utils";
import { MapPin, Clock, ArrowRight, Search, SlidersHorizontal } from "lucide-react";
import { TripTypeBadge } from "@/components/ui";
import { PackageFilters } from "@/components/packages/package-filters";

export const metadata = { title: "Tour Packages" };

interface SearchParams {
  type?: string;
  search?: string;
  sort?: string;
  location?: string;
  minPrice?: string;
  maxPrice?: string;
}

async function getPackages(params: SearchParams) {
  const where: any = { isActive: true };

  // Filter by trip type
  if (params.type === "open") where.tripType = "OPEN_TRIP";
  if (params.type === "private") where.tripType = "PRIVATE_TRIP";

  // Search by title or location
  if (params.search) {
    where.OR = [
      { title: { contains: params.search, mode: "insensitive" } },
      { location: { contains: params.search, mode: "insensitive" } },
      { description: { contains: params.search, mode: "insensitive" } },
    ];
  }

  // Filter by location
  if (params.location) {
    where.location = { contains: params.location, mode: "insensitive" };
  }

  // Determine sort order
  let orderBy: any = { createdAt: "desc" };
  if (params.sort === "title-asc") orderBy = { title: "asc" };
  if (params.sort === "title-desc") orderBy = { title: "desc" };
  if (params.sort === "newest") orderBy = { createdAt: "desc" };
  if (params.sort === "oldest") orderBy = { createdAt: "asc" };

  const packages = await prisma.tourPackage.findMany({
    where,
    orderBy,
    include: {
      highlights: { take: 3, orderBy: { order: "asc" } },
      departures: {
        where: { departureDate: { gte: new Date() } },
        select: { pricePerPerson: true, groups: { select: { price: true } } },
        take: 10,
      },
    },
  });

  // Calculate min price and filter by price range
  const packagesWithPrice = packages.map((pkg) => {
    const prices: number[] = [];
    pkg.departures.forEach((d) => {
      if (d.pricePerPerson) prices.push(Number(d.pricePerPerson));
      d.groups.forEach((g) => prices.push(Number(g.price)));
    });
    const minPrice = prices.length > 0 ? Math.min(...prices) : null;
    return { ...pkg, minPrice };
  });

  // Filter by price range
  let filtered = packagesWithPrice;
  if (params.minPrice) {
    const min = parseInt(params.minPrice);
    filtered = filtered.filter((p) => p.minPrice !== null && p.minPrice >= min);
  }
  if (params.maxPrice) {
    const max = parseInt(params.maxPrice);
    filtered = filtered.filter((p) => p.minPrice !== null && p.minPrice <= max);
  }

  // Sort by price if requested
  if (params.sort === "price-asc") {
    filtered.sort((a, b) => (a.minPrice || 0) - (b.minPrice || 0));
  }
  if (params.sort === "price-desc") {
    filtered.sort((a, b) => (b.minPrice || 0) - (a.minPrice || 0));
  }

  // Get unique locations for filter
  const allPackages = await prisma.tourPackage.findMany({
    where: { isActive: true },
    select: { location: true },
    distinct: ["location"],
  });
  const locations = allPackages.map((p) => p.location);

  return { packages: filtered, total: filtered.length, locations };
}

export default async function PackagesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const { packages, total, locations } = await getPackages(params);

  return (
    <div className="py-12">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Tour Packages</h1>
          <p className="text-slate-600 max-w-2xl mx-auto">Browse our collection of carefully curated tour packages</p>
        </div>

        {/* Filters Component */}
        <PackageFilters 
          currentType={params.type} 
          currentSort={params.sort} 
          currentSearch={params.search}
          currentLocation={params.location}
          currentMinPrice={params.minPrice}
          currentMaxPrice={params.maxPrice}
          locations={locations}
        />

        {/* Results */}
        <p className="text-slate-500 mb-6">Showing {total} package(s)</p>

        {packages.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {packages.map((pkg) => (
              <Link key={pkg.id} href={`/packages/${pkg.slug}`} className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300">
                <div className="relative h-56 overflow-hidden">
                  {pkg.thumbnail ? (
                    <Image src={pkg.thumbnail} alt={pkg.title} fill className="object-cover group-hover:scale-110 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-emerald-400 to-teal-500" />
                  )}
                  <div className="absolute top-4 left-4"><TripTypeBadge type={pkg.tripType} /></div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-2 group-hover:text-emerald-600 transition-colors">{pkg.title}</h3>
                  <div className="flex items-center gap-4 text-sm text-slate-500 mb-4">
                    <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{pkg.location}</span>
                    <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{pkg.duration}</span>
                  </div>
                  {pkg.highlights.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {pkg.highlights.slice(0, 3).map((h) => (
                        <span key={h.id} className="text-xs px-2 py-1 bg-slate-100 rounded-full text-slate-600">{h.title}</span>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    {pkg.minPrice ? (
                      <div>
                        <span className="text-sm text-slate-500">Starting from</span>
                        <p className="text-lg font-bold text-emerald-600">{formatPrice(pkg.minPrice)}</p>
                      </div>
                    ) : (
                      <span className="text-slate-500">Contact for price</span>
                    )}
                    <span className="text-emerald-600 font-medium group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                      View <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-2xl">
            <Search className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No packages found</h3>
            <p className="text-slate-500 mb-4">Try adjusting your filters</p>
            <Link href="/packages" className="text-emerald-600 font-medium hover:underline">Clear all filters</Link>
          </div>
        )}
      </div>
    </div>
  );
}
