import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatPrice, formatDate } from "@/lib/utils";
import { Eye, Calendar, User } from "lucide-react";
import { BookingStatusBadge, TripTypeBadge } from "@/components/ui";
import { AdminBookingFilters } from "@/components/admin/booking-filters";
import { ExportButton } from "@/components/admin/export-button";

interface SearchParams {
  search?: string;
  status?: string;
  type?: string;
  sort?: string;
  from?: string;
  to?: string;
}

async function getBookings(params: SearchParams) {
  const where: any = {};

  if (params.search) {
    where.OR = [
      { bookingCode: { contains: params.search, mode: "insensitive" } },
      { user: { name: { contains: params.search, mode: "insensitive" } } },
      { user: { email: { contains: params.search, mode: "insensitive" } } },
      { user: { phone: { contains: params.search, mode: "insensitive" } } },
    ];
  }

  if (params.status) {
    where.status = params.status;
  }

  if (params.type === "open") where.tripType = "OPEN_TRIP";
  if (params.type === "private") where.tripType = "PRIVATE_TRIP";

  if (params.from || params.to) {
    where.createdAt = {};
    if (params.from) where.createdAt.gte = new Date(params.from);
    if (params.to) where.createdAt.lte = new Date(params.to + "T23:59:59");
  }

  let orderBy: any = { createdAt: "desc" };
  if (params.sort === "oldest") orderBy = { createdAt: "asc" };
  if (params.sort === "amount-asc") orderBy = { totalAmount: "asc" };
  if (params.sort === "amount-desc") orderBy = { totalAmount: "desc" };

  return prisma.booking.findMany({
    where,
    orderBy,
    include: {
      user: { select: { name: true, email: true, phone: true } },
      departure: { include: { tourPackage: { select: { title: true, slug: true } } } },
      _count: { select: { participants: true } },
    },
  });
}

export default async function AdminBookingsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const bookings = await getBookings(params);

  const exportData = bookings.map(b => ({
    "Booking Code": b.bookingCode,
    "Customer Name": b.user.name,
    "Customer Contact": b.user.email || b.user.phone,
    "Package": b.departure.tourPackage.title,
    "Trip Type": b.tripType,
    "Departure Date": formatDate(b.departure.departureDate),
    "Participants": b._count.participants,
    "Amount": Number(b.totalAmount),
    "Status": b.status,
    "Booked At": formatDate(b.createdAt),
    "Payment Deadline": formatDate(b.paymentDeadline),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Bookings</h1>
          <p className="text-slate-600">Manage all customer bookings ({bookings.length} total)</p>
        </div>
        <ExportButton data={exportData} filename="bookings" />
      </div>

      <AdminBookingFilters
        currentSearch={params.search}
        currentStatus={params.status}
        currentType={params.type}
        currentSort={params.sort}
        currentFrom={params.from}
        currentTo={params.to}
      />

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-4 text-xs font-medium text-slate-500 uppercase">Booking</th>
                <th className="text-left px-6 py-4 text-xs font-medium text-slate-500 uppercase">Customer</th>
                <th className="text-left px-6 py-4 text-xs font-medium text-slate-500 uppercase">Package</th>
                <th className="text-left px-6 py-4 text-xs font-medium text-slate-500 uppercase">Departure</th>
                <th className="text-left px-6 py-4 text-xs font-medium text-slate-500 uppercase">Amount</th>
                <th className="text-left px-6 py-4 text-xs font-medium text-slate-500 uppercase">Status</th>
                <th className="text-right px-6 py-4 text-xs font-medium text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {bookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-mono font-medium text-slate-900">{booking.bookingCode}</p>
                      <p className="text-xs text-slate-500">{formatDate(booking.createdAt)}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                        <User className="w-4 h-4 text-slate-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">{booking.user.name}</p>
                        <p className="text-xs text-slate-500">{booking.user.email || booking.user.phone}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{booking.departure.tourPackage.title}</p>
                      <TripTypeBadge type={booking.tripType} />
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 text-sm text-slate-600">
                      <Calendar className="w-4 h-4" />
                      {formatDate(booking.departure.departureDate)}
                    </div>
                    <p className="text-xs text-slate-500">{booking._count.participants} participant(s)</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-semibold text-emerald-600">{formatPrice(Number(booking.totalAmount))}</p>
                  </td>
                  <td className="px-6 py-4">
                    <BookingStatusBadge status={booking.status} />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/admin/bookings/${booking.id}`} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600">
                        <Eye className="w-4 h-4" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {bookings.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-slate-300" />
            <p>No bookings found</p>
          </div>
        )}
      </div>
    </div>
  );
}
