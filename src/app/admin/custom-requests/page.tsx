import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatPrice, formatDate } from "@/lib/utils";
import { Eye, Calendar, User, MapPin } from "lucide-react";
import { CustomRequestStatusBadge } from "@/components/ui";
import { AdminRequestFilters } from "@/components/admin/request-filters";
import { ExportButton } from "@/components/admin/export-button";

interface SearchParams {
  search?: string;
  status?: string;
  sort?: string;
  from?: string;
  to?: string;
}

async function getCustomRequests(params: SearchParams) {
  const where: any = {};

  if (params.search) {
    where.OR = [
      { requestCode: { contains: params.search, mode: "insensitive" } },
      { destination: { contains: params.search, mode: "insensitive" } },
      { user: { name: { contains: params.search, mode: "insensitive" } } },
      { user: { email: { contains: params.search, mode: "insensitive" } } },
      { user: { phone: { contains: params.search, mode: "insensitive" } } },
    ];
  }

  if (params.status) {
    where.status = params.status;
  }

  if (params.from || params.to) {
    where.createdAt = {};
    if (params.from) where.createdAt.gte = new Date(params.from);
    if (params.to) where.createdAt.lte = new Date(params.to + "T23:59:59");
  }

  let orderBy: any = { createdAt: "desc" };
  if (params.sort === "oldest") orderBy = { createdAt: "asc" };
  if (params.sort === "departure") orderBy = { departureDate: "asc" };

  return prisma.customTourRequest.findMany({
    where,
    orderBy,
    include: {
      user: { select: { name: true, email: true, phone: true } },
      tourGuide: { select: { name: true } },
    },
  });
}

export default async function AdminCustomRequestsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const requests = await getCustomRequests(params);

  const exportData = requests.map(r => ({
    "Request Code": r.requestCode,
    "Customer Name": r.user.name,
    "Customer Contact": r.user.email || r.user.phone,
    "Destination": r.destination,
    "Duration": r.duration,
    "Departure Date": formatDate(r.departureDate),
    "Participants": r.participantCount,
    "Meeting Point": r.meetingPoint,
    "Estimated Price": r.estimatedPrice ? Number(r.estimatedPrice) : "",
    "Final Price": r.finalPrice ? Number(r.finalPrice) : "",
    "Status": r.status,
    "Tour Guide": r.tourGuide?.name || "",
    "Created At": formatDate(r.createdAt),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Custom Tour Requests</h1>
          <p className="text-slate-600">Review and manage custom tour requests ({requests.length} total)</p>
        </div>
        <ExportButton data={exportData} filename="custom-requests" />
      </div>

      <AdminRequestFilters
        currentSearch={params.search}
        currentStatus={params.status}
        currentSort={params.sort}
        currentFrom={params.from}
        currentTo={params.to}
      />

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-225">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-4 text-xs font-medium text-slate-500 uppercase">Request</th>
                <th className="text-left px-6 py-4 text-xs font-medium text-slate-500 uppercase">Customer</th>
                <th className="text-left px-6 py-4 text-xs font-medium text-slate-500 uppercase">Destination</th>
                <th className="text-left px-6 py-4 text-xs font-medium text-slate-500 uppercase">Details</th>
                <th className="text-left px-6 py-4 text-xs font-medium text-slate-500 uppercase">Price</th>
                <th className="text-left px-6 py-4 text-xs font-medium text-slate-500 uppercase">Status</th>
                <th className="text-right px-6 py-4 text-xs font-medium text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {requests.map((request) => (
                <tr key={request.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-slate-900">{request.requestCode}</p>
                      <p className="text-xs text-slate-500">{formatDate(request.createdAt)}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                        <User className="w-4 h-4 text-slate-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">{request.user.name}</p>
                        <p className="text-xs text-slate-500">{request.user.email || request.user.phone}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 text-sm">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      {request.destination}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      <p className="flex items-center gap-1"><Calendar className="w-4 h-4 text-slate-400" />{formatDate(request.departureDate)}</p>
                      <p className="text-slate-500">{request.duration} • {request.participantCount} pax</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {request.finalPrice ? (
                      <p className="font-semibold text-emerald-600">{formatPrice(Number(request.finalPrice))}</p>
                    ) : request.estimatedPrice ? (
                      <p className="text-amber-600">~{formatPrice(Number(request.estimatedPrice))}</p>
                    ) : (
                      <p className="text-slate-400">-</p>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <CustomRequestStatusBadge status={request.status} />
                    {request.tourGuide && <p className="text-xs text-slate-500 mt-1">Guide: {request.tourGuide.name}</p>}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/admin/custom-requests/${request.id}`} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600">
                        <Eye className="w-4 h-4" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {requests.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            <MapPin className="w-12 h-12 mx-auto mb-4 text-slate-300" />
            <p>No custom requests found</p>
          </div>
        )}
      </div>
    </div>
  );
}
