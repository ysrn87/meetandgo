import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatPrice, formatDate } from "@/lib/utils";
import { Plus, Edit, Eye, MapPin, Calendar, Download } from "lucide-react";
import { Button, TripTypeBadge, Badge } from "@/components/ui";
import { AdminPackageFilters } from "@/components/admin/package-filters";
import { ExportButton } from "@/components/admin/export-button";

interface SearchParams {
  search?: string;
  type?: string;
  status?: string;
  sort?: string;
}

async function getAdminPackages(params: SearchParams) {
  const where: any = {};

  if (params.search) {
    where.OR = [
      { title: { contains: params.search, mode: "insensitive" } },
      { location: { contains: params.search, mode: "insensitive" } },
    ];
  }

  if (params.type === "open") where.tripType = "OPEN_TRIP";
  if (params.type === "private") where.tripType = "PRIVATE_TRIP";

  if (params.status === "active") where.isActive = true;
  if (params.status === "inactive") where.isActive = false;

  let orderBy: any = { createdAt: "desc" };
  if (params.sort === "title-asc") orderBy = { title: "asc" };
  if (params.sort === "title-desc") orderBy = { title: "desc" };
  if (params.sort === "oldest") orderBy = { createdAt: "asc" };

  return prisma.tourPackage.findMany({
    where,
    orderBy,
    include: {
      departures: { select: { id: true, departureDate: true, pricePerPerson: true }, orderBy: { departureDate: "asc" }, take: 3 },
      _count: { select: { departures: true } },
    },
  });
}

export default async function AdminPackagesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const packages = await getAdminPackages(params);

  const exportData = packages.map(pkg => ({
    Title: pkg.title,
    Type: pkg.tripType,
    Location: pkg.location,
    Duration: pkg.duration,
    Status: pkg.isActive ? "Active" : "Inactive",
    Departures: pkg._count.departures,
    "Created At": formatDate(pkg.createdAt),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tour Packages</h1>
          <p className="text-slate-600">Manage your tour packages and departures</p>
        </div>
        <div className="flex gap-2">
          <ExportButton data={exportData} filename="packages" />
          <Link href="/admin/packages/new">
            <Button><Plus className="w-4 h-4" /> Add Package</Button>
          </Link>
        </div>
      </div>

      <AdminPackageFilters 
        currentSearch={params.search}
        currentType={params.type}
        currentStatus={params.status}
        currentSort={params.sort}
      />

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-175">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-4 text-xs font-medium text-slate-500 uppercase">Package</th>
                <th className="text-left px-6 py-4 text-xs font-medium text-slate-500 uppercase">Type</th>
                <th className="text-left px-6 py-4 text-xs font-medium text-slate-500 uppercase">Location</th>
                <th className="text-left px-6 py-4 text-xs font-medium text-slate-500 uppercase">Departures</th>
                <th className="text-left px-6 py-4 text-xs font-medium text-slate-500 uppercase">Status</th>
                <th className="text-right px-6 py-4 text-xs font-medium text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {packages.map((pkg) => (
                <tr key={pkg.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-emerald-100 flex items-center justify-center overflow-hidden">
                        {pkg.thumbnail ? (
                          <img src={pkg.thumbnail} alt={pkg.title} className="w-full h-full object-cover" />
                        ) : (
                          <MapPin className="w-5 h-5 text-emerald-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{pkg.title}</p>
                        <p className="text-sm text-slate-500">{pkg.duration}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4"><TripTypeBadge type={pkg.tripType} /></td>
                  <td className="px-6 py-4 text-slate-600">{pkg.location}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 text-sm text-slate-600">
                      <Calendar className="w-4 h-4" />
                      {pkg._count.departures} schedule(s)
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={pkg.isActive ? "success" : "default"}>{pkg.isActive ? "Active" : "Inactive"}</Badge>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/packages/${pkg.slug}`} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600">
                        <Eye className="w-4 h-4" />
                      </Link>
                      <Link href={`/admin/packages/${pkg.id}/edit`} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600">
                        <Edit className="w-4 h-4" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {packages.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            <MapPin className="w-12 h-12 mx-auto mb-4 text-slate-300" />
            <p>No packages found. {params.search || params.type || params.status ? "Try adjusting your filters." : "Create your first package!"}</p>
          </div>
        )}
      </div>
    </div>
  );
}
