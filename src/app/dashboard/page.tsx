import Link from "next/link";
import { auth } from "@/lib/auth";
import { getBookingsByUser, getCustomRequestsByUser } from "@/services";
import { formatDate, formatPrice } from "@/lib/utils";
import { Card, BookingStatusBadge, CustomRequestStatusBadge } from "@/components/ui";
import { Calendar, Map, Users, ArrowRight } from "lucide-react";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const session = await auth();
  if (!session) return null;

  const [bookings, customRequests] = await Promise.all([
    getBookingsByUser(session.user.id),
    getCustomRequestsByUser(session.user.id),
  ]);

  const activeBookings = bookings.filter((b) => !["COMPLETED", "CANCELLED", "EXPIRED"].includes(b.status));
  const pendingRequests = customRequests.filter((r) => !["COMPLETED", "REJECTED", "CANCELLED"].includes(r.status));

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold">Welcome back, {session.user.name?.split(" ")[0]}!</h1>
        <p className="text-slate-600">Here&apos;s an overview of your travel activities</p>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card variant="bordered" className="flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
            <Calendar className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <p className="text-2xl font-bold">{bookings.length}</p>
            <p className="text-sm text-slate-500">Total Bookings</p>
          </div>
        </Card>
        <Card variant="bordered" className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
            <Map className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold">{customRequests.length}</p>
            <p className="text-sm text-slate-500">Custom Requests</p>
          </div>
        </Card>
        <Card variant="bordered" className="flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
            <Users className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <p className="text-2xl font-bold">{activeBookings.length}</p>
            <p className="text-sm text-slate-500">Active Trips</p>
          </div>
        </Card>
      </div>

      {/* Recent Bookings */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Recent Bookings</h2>
          <Link href="/dashboard/bookings" className="text-emerald-600 text-sm font-medium flex items-center gap-1">
            View all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        {bookings.length > 0 ? (
          <div className="space-y-3">
            {bookings.slice(0, 3).map((booking) => (
              <Card key={booking.id} variant="bordered" className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{booking.departure.tourPackage.title}</p>
                  <p className="text-sm text-slate-500">
                    {formatDate(booking.departure.departureDate)} · {booking.bookingCode}
                  </p>
                </div>
                <div className="text-right">
                  <BookingStatusBadge status={booking.status} />
                  <p className="text-sm font-medium text-slate-700 mt-1">{formatPrice(Number(booking.totalAmount))}</p>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card variant="bordered" className="text-center py-8">
            <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No bookings yet</p>
            <Link href="/packages" className="text-emerald-600 font-medium mt-2 inline-block">Browse packages</Link>
          </Card>
        )}
      </div>

      {/* Recent Custom Requests */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Custom Requests</h2>
          <Link href="/dashboard/custom-requests" className="text-emerald-600 text-sm font-medium flex items-center gap-1">
            View all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        {customRequests.length > 0 ? (
          <div className="space-y-3">
            {customRequests.slice(0, 3).map((request) => (
              <Card key={request.id} variant="bordered" className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{request.destination}</p>
                  <p className="text-sm text-slate-500">
                    {formatDate(request.departureDate)} · {request.requestCode}
                  </p>
                </div>
                <div className="text-right">
                  <CustomRequestStatusBadge status={request.status} />
                  {request.finalPrice && <p className="text-sm font-medium text-slate-700 mt-1">{formatPrice(Number(request.finalPrice))}</p>}
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card variant="bordered" className="text-center py-8">
            <Map className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No custom requests</p>
            <Link href="/custom-request" className="text-emerald-600 font-medium mt-2 inline-block">Create a request</Link>
          </Card>
        )}
      </div>
    </div>
  );
}
