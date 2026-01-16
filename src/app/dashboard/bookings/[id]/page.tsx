import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { formatPrice, formatDate, getTimeRemaining, isPaymentExpired } from "@/lib/utils";
import { ArrowLeft, Calendar, MapPin, Users, Clock, AlertTriangle, CheckCircle, CreditCard } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, BookingStatusBadge, TripTypeBadge, Badge } from "@/components/ui";

async function getBooking(id: string, userId: string) {
  return prisma.booking.findFirst({
    where: { id, userId },
    include: {
      departure: {
        include: {
          tourPackage: { select: { title: true, slug: true, location: true, duration: true, thumbnail: true } }
        }
      },
      departureGroup: true,
      participants: { include: { participant: true } },
    },
  });
}

export default async function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const booking = await getBooking(id, user.id);
  if (!booking) notFound();

  const isPending = booking.status === "PENDING";
  const isExpired = isPending && isPaymentExpired(booking.paymentDeadline);
  const pkg = booking.departure.tourPackage;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/bookings" className="p-2 rounded-lg hover:bg-slate-100">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-slate-900">{booking.bookingCode}</h1>
            <BookingStatusBadge status={booking.status} />
          </div>
          <p className="text-slate-600">Booked on {formatDate(booking.createdAt)}</p>
        </div>
      </div>

      {/* Payment Warning */}
      {isPending && !isExpired && (
        <Card variant="bordered" className="border-amber-200 bg-amber-50">
          <CardContent className="flex items-start gap-4">
            <AlertTriangle className="w-6 h-6 text-amber-500 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-amber-800">Payment Required</h3>
              <p className="text-amber-700">Please complete your payment within <strong>{getTimeRemaining(booking.paymentDeadline)}</strong> to confirm your booking.</p>
              <p className="text-sm text-amber-600 mt-2">Transfer to: Bank BCA 1234567890 a/n PT MeetAndGo Indonesia</p>
            </div>
          </CardContent>
        </Card>
      )}

      {isExpired && (
        <Card variant="bordered" className="border-red-200 bg-red-50">
          <CardContent className="flex items-start gap-4">
            <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-red-800">Booking Expired</h3>
              <p className="text-red-700">Your payment deadline has passed. Please create a new booking.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {booking.status === "PAYMENT_RECEIVED" && (
        <Card variant="bordered" className="border-emerald-200 bg-emerald-50">
          <CardContent className="flex items-start gap-4">
            <CheckCircle className="w-6 h-6 text-emerald-500 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-emerald-800">Payment Confirmed</h3>
              <p className="text-emerald-700">Thank you! Your payment has been received. We're processing your booking.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Package Info */}
      <Card variant="bordered">
        <CardHeader><CardTitle className="flex items-center gap-2"><MapPin className="w-5 h-5" /> Trip Details</CardTitle></CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="w-24 h-24 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0">
              {pkg.thumbnail ? (
                <img src={pkg.thumbnail} alt={pkg.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center"><MapPin className="w-8 h-8 text-slate-300" /></div>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <TripTypeBadge type={booking.tripType} />
              </div>
              <h3 className="font-semibold text-slate-900">{pkg.title}</h3>
              <p className="text-sm text-slate-500">{pkg.location} • {pkg.duration}</p>
              <Link href={`/packages/${pkg.slug}`} className="text-sm text-emerald-600 hover:underline">View package details →</Link>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Booking Info */}
      <Card variant="bordered">
        <CardHeader><CardTitle className="flex items-center gap-2"><Calendar className="w-5 h-5" /> Booking Information</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-slate-500">Departure Date</p>
              <p className="font-medium">{formatDate(booking.departure.departureDate)}</p>
            </div>
            {booking.departureGroup && (
              <div>
                <p className="text-sm text-slate-500">Group</p>
                <p className="font-medium">Group {booking.departureGroup.groupNumber}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-slate-500">Participants</p>
              <p className="font-medium">{booking.participantCount} person(s)</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Amount</p>
              <p className="text-xl font-bold text-emerald-600">{formatPrice(Number(booking.totalAmount))}</p>
            </div>
          </div>
          {isPending && !isExpired && (
            <div className="p-3 bg-slate-50 rounded-lg">
              <p className="text-sm text-slate-600 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Payment deadline: {formatDate(booking.paymentDeadline)} ({getTimeRemaining(booking.paymentDeadline)})
              </p>
            </div>
          )}
          {booking.paidAt && (
            <div className="p-3 bg-emerald-50 rounded-lg">
              <p className="text-sm text-emerald-700 flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Paid on: {formatDate(booking.paidAt)}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Participants */}
      <Card variant="bordered">
        <CardHeader><CardTitle className="flex items-center gap-2"><Users className="w-5 h-5" /> Participants ({booking.participants.length})</CardTitle></CardHeader>
        <CardContent>
          <div className="divide-y divide-slate-100">
            {booking.participants.map(({ participant, isPrimary }, index) => (
              <div key={participant.id} className="py-4 first:pt-0 last:pb-0">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-slate-900">
                      {index + 1}. {participant.fullName}
                      {isPrimary && <Badge size="sm" className="ml-2">Primary</Badge>}
                    </p>
                    <p className="text-sm text-slate-500">{participant.gender} {participant.birthDate && `• Born ${formatDate(participant.birthDate)}`}</p>
                    {participant.idNumber && <p className="text-sm text-slate-500">ID: {participant.idNumber}</p>}
                  </div>
                  <div className="text-right text-sm text-slate-500">
                    {participant.phone && <p>{participant.phone}</p>}
                    {participant.domicile && <p>{participant.domicile}</p>}
                  </div>
                </div>
                {participant.healthHistory && (
                  <p className="text-sm text-amber-600 mt-2">Health notes: {participant.healthHistory}</p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      {booking.notes && (
        <Card variant="bordered">
          <CardHeader><CardTitle>Your Notes</CardTitle></CardHeader>
          <CardContent>
            <p className="text-slate-600 whitespace-pre-wrap">{booking.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex gap-4">
        <Link href="/dashboard/bookings" className="flex-1">
          <button className="w-full px-4 py-3 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors">
            Back to Bookings
          </button>
        </Link>
        {isPending && !isExpired && (
          <a 
            href={`https://wa.me/6281234567890?text=Hi, saya sudah melakukan pembayaran untuk booking ${booking.bookingCode}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1"
          >
            <button className="w-full px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
              Confirm Payment via WhatsApp
            </button>
          </a>
        )}
      </div>
    </div>
  );
}
