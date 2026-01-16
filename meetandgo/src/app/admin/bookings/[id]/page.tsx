import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatPrice, formatDate, getTimeRemaining } from "@/lib/utils";
import { ArrowLeft, User, Calendar, MapPin, Users, Clock } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, BookingStatusBadge, TripTypeBadge, Badge } from "@/components/ui";
import { BookingStatusForm } from "@/components/admin/booking-status-form";
import { BOOKING_STATUS_FLOW } from "@/types";

async function getBooking(id: string) {
  return prisma.booking.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true } },
      departure: { include: { tourPackage: { select: { id: true, title: true, slug: true, location: true, duration: true } } } },
      departureGroup: true,
      participants: { include: { participant: true } },
    },
  });
}

export default async function AdminBookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const booking = await getBooking(id);
  if (!booking) notFound();

  const currentStatusIndex = BOOKING_STATUS_FLOW.indexOf(booking.status as typeof BOOKING_STATUS_FLOW[number]);
  const canUpdateStatus = currentStatusIndex >= 0 && currentStatusIndex < BOOKING_STATUS_FLOW.length - 1;
  const isPending = booking.status === "PENDING";

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/bookings" className="p-2 rounded-lg hover:bg-slate-100"><ArrowLeft className="w-5 h-5" /></Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">{booking.bookingCode}</h1>
            <BookingStatusBadge status={booking.status} />
          </div>
          <p className="text-slate-600">Created {formatDate(booking.createdAt)}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Customer Info */}
        <Card variant="bordered">
          <CardHeader><CardTitle className="flex items-center gap-2"><User className="w-5 h-5" /> Customer</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div><p className="text-sm text-slate-500">Name</p><p className="font-medium">{booking.user.name}</p></div>
            <div><p className="text-sm text-slate-500">Email</p><p className="font-medium">{booking.user.email || "-"}</p></div>
            <div><p className="text-sm text-slate-500">Phone</p><p className="font-medium">{booking.user.phone || "-"}</p></div>
          </CardContent>
        </Card>

        {/* Booking Info */}
        <Card variant="bordered">
          <CardHeader><CardTitle className="flex items-center gap-2"><Calendar className="w-5 h-5" /> Booking Details</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div><p className="text-sm text-slate-500">Package</p><p className="font-medium">{booking.departure.tourPackage.title}</p></div>
            <div><p className="text-sm text-slate-500">Type</p><TripTypeBadge type={booking.tripType} /></div>
            <div><p className="text-sm text-slate-500">Departure Date</p><p className="font-medium">{formatDate(booking.departure.departureDate)}</p></div>
            <div><p className="text-sm text-slate-500">Total Amount</p><p className="text-xl font-bold text-primary-600">{formatPrice(Number(booking.totalAmount))}</p></div>
            {isPending && (
              <div className="p-3 bg-amber-50 rounded-lg">
                <p className="text-sm text-amber-700 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Payment deadline: {getTimeRemaining(booking.paymentDeadline)}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Participants */}
      <Card variant="bordered">
        <CardHeader><CardTitle className="flex items-center gap-2"><Users className="w-5 h-5" /> Participants ({booking.participants.length})</CardTitle></CardHeader>
        <CardContent>
          <div className="divide-y divide-slate-100">
            {booking.participants.map(({ participant, isPrimary }) => (
              <div key={participant.id} className="py-4 first:pt-0 last:pb-0">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-slate-900">{participant.fullName} {isPrimary && <Badge size="sm">Primary</Badge>}</p>
                    <p className="text-sm text-slate-500">{participant.gender} • {participant.idNumber || "No ID"}</p>
                  </div>
                  <div className="text-right text-sm text-slate-500">
                    <p>{participant.phone || "-"}</p>
                    <p>{participant.domicile || "-"}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Status Update */}
      {canUpdateStatus && !["CANCELLED", "EXPIRED"].includes(booking.status) && (
        <Card variant="bordered">
          <CardHeader><CardTitle>Update Status</CardTitle></CardHeader>
          <CardContent>
            <BookingStatusForm bookingId={booking.id} currentStatus={booking.status} />
          </CardContent>
        </Card>
      )}

      {booking.notes && (
        <Card variant="bordered">
          <CardHeader><CardTitle>Notes</CardTitle></CardHeader>
          <CardContent><p className="text-slate-600 whitespace-pre-wrap">{booking.notes}</p></CardContent>
        </Card>
      )}
    </div>
  );
}
