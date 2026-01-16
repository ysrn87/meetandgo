import Link from "next/link";
import { auth } from "@/lib/auth";
import { getBookingsByUser } from "@/services";
import { formatDate, formatPrice, getTimeRemaining } from "@/lib/utils";
import { Card, BookingStatusBadge, TripTypeBadge } from "@/components/ui";
import { Calendar, MapPin, Clock, ExternalLink } from "lucide-react";

export const metadata = { title: "My Bookings" };

export default async function BookingsPage() {
  const session = await auth();
  if (!session) return null;

  const bookings = await getBookingsByUser(session.user.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Bookings</h1>
        <p className="text-slate-600">View and manage your trip bookings</p>
      </div>

      {bookings.length > 0 ? (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <Card key={booking.id} variant="bordered">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <BookingStatusBadge status={booking.status} />
                    <TripTypeBadge type={booking.tripType} />
                  </div>
                  <h3 className="text-lg font-semibold">{booking.departure.tourPackage.title}</h3>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 mt-2">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {formatDate(booking.departure.departureDate)}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {booking.departure.tourPackage.location}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 mt-1">
                    Booking Code: <span className="font-mono font-medium">{booking.bookingCode}</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-emerald-600">{formatPrice(Number(booking.totalAmount))}</p>
                  <p className="text-sm text-slate-500">{booking.participantCount} participant(s)</p>
                  {booking.status === "PENDING" && (
                    <p className="text-sm text-amber-600 mt-1 flex items-center gap-1 justify-end">
                      <Clock className="w-4 h-4" />
                      {getTimeRemaining(booking.paymentDeadline)}
                    </p>
                  )}
                </div>
              </div>
              <div className="mt-4 pt-4 border-t flex justify-end">
                <Link
                  href={`/dashboard/bookings/${booking.id}`}
                  className="text-emerald-600 font-medium text-sm flex items-center gap-1 hover:underline"
                >
                  View Details <ExternalLink className="w-4 h-4" />
                </Link>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card variant="bordered" className="text-center py-12">
          <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-900 mb-2">No bookings yet</h3>
          <p className="text-slate-500 mb-4">Start your adventure by booking a trip</p>
          <Link href="/packages" className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700">
            Browse Packages
          </Link>
        </Card>
      )}
    </div>
  );
}
