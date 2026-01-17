import { notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatPrice, formatDate, formatDateTime } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent, Badge, Button, Alert } from "@/components/ui";
import { PaymentOptions } from "@/components/booking/payment-options";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  Clock,
  CreditCard,
  User,
  Phone,
  Mail,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "success" | "warning" }> = {
  PENDING: { label: "Pending Payment", variant: "warning" },
  PAYMENT_RECEIVED: { label: "Payment Received", variant: "success" },
  PROCESSED: { label: "Processed", variant: "success" },
  ONGOING: { label: "Ongoing", variant: "success" },
  COMPLETED: { label: "Completed", variant: "success" },
  CANCELLED: { label: "Cancelled", variant: "default" },
  EXPIRED: { label: "Expired", variant: "default" },
};

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ payment?: string }>;
}

export default async function BookingDetailPage({ params, searchParams }: PageProps) {
  const user = await getCurrentUser();
  if (!user) {
    notFound();
  }

  const { id } = await params;
  const { payment } = await searchParams;

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      user: {
        select: { id: true, name: true, email: true, phone: true },
      },
      departure: {
        include: {
          tourPackage: {
            select: { id: true, title: true, slug: true, location: true, duration: true, thumbnail: true, tripType: true },
          },
        },
      },
      departureGroup: true,
      participants: {
        include: {
          participant: true,
        },
        orderBy: { isPrimary: "desc" },
      },
    },
  });

  if (!booking || booking.userId !== user.id) {
    notFound();
  }

  const statusConfig = STATUS_CONFIG[booking.status] || { label: booking.status, variant: "default" as const };
  const isPrivateTrip = booking.tripType === "PRIVATE_TRIP";
  const isPending = booking.status === "PENDING";
  const isExpired = booking.status === "EXPIRED";
  const isCancelled = booking.status === "CANCELLED";
  const isPaid = ["PAYMENT_RECEIVED", "PROCESSED", "ONGOING", "COMPLETED"].includes(booking.status);

  // Check if payment deadline has passed
  const deadlinePassed = new Date() > new Date(booking.paymentDeadline);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/bookings" className="p-2 rounded-lg hover:bg-slate-100">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">Booking Details</h1>
            <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
          </div>
          <p className="text-slate-600">Booking Code: {booking.bookingCode}</p>
        </div>
      </div>

      {/* Payment Status Alerts */}
      {payment === "success" && (
        <Alert variant="success" className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          Payment successful! Your booking is being processed.
        </Alert>
      )}
      {payment === "pending" && (
        <Alert variant="warning" className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          Payment is pending. Please complete your payment to confirm the booking.
        </Alert>
      )}
      {payment === "error" && (
        <Alert variant="error" className="flex items-center gap-2">
          <XCircle className="w-5 h-5" />
          Payment failed. Please try again or choose a different payment method.
        </Alert>
      )}

      {/* Deadline Warning */}
      {isPending && !deadlinePassed && (
        <Alert variant="warning">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            <div>
              <p className="font-medium">Complete your payment before the deadline</p>
              <p className="text-sm">Deadline: {formatDateTime(booking.paymentDeadline)}</p>
            </div>
          </div>
        </Alert>
      )}

      {isPending && deadlinePassed && (
        <Alert variant="error">
          <div className="flex items-center gap-2">
            <XCircle className="w-5 h-5" />
            <div>
              <p className="font-medium">Payment deadline has passed</p>
              <p className="text-sm">This booking may be automatically cancelled.</p>
            </div>
          </div>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Package Info */}
          <Card variant="bordered">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-600" />
                Package Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <div className="w-24 h-24 rounded-lg bg-slate-100 overflow-hidden shrink-0">
                  {booking.departure.tourPackage.thumbnail ? (
                    <img
                      src={booking.departure.tourPackage.thumbnail}
                      alt={booking.departure.tourPackage.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                      <MapPin className="w-8 h-8" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/packages/${booking.departure.tourPackage.slug}`}
                    className="font-semibold text-slate-900 hover:text-emerald-600 transition-colors"
                  >
                    {booking.departure.tourPackage.title}
                  </Link>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-slate-600">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {booking.departure.tourPackage.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {booking.departure.tourPackage.duration}
                    </span>
                  </div>
                  <Badge variant={isPrivateTrip ? "warning" : "success"} className="mt-2">
                    {isPrivateTrip ? "Private Trip" : "Open Trip"}
                  </Badge>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">Departure Date</p>
                  <p className="font-medium text-slate-900 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-emerald-600" />
                    {formatDate(booking.departure.departureDate)}
                  </p>
                </div>
                {isPrivateTrip && booking.departureGroup && (
                  <div>
                    <p className="text-sm text-slate-500">Group</p>
                    <p className="font-medium text-slate-900 flex items-center gap-2">
                      <Users className="w-4 h-4 text-emerald-600" />
                      Group {booking.departureGroup.groupNumber}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-slate-500">Participants</p>
                  <p className="font-medium text-slate-900 flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-600" />
                    {booking.participantCount} person(s)
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Booking Date</p>
                  <p className="font-medium text-slate-900">{formatDateTime(booking.createdAt)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Participants */}
          <Card variant="bordered">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-600" />
                Participants ({booking.participants.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {booking.participants.map((bp, index) => (
                <div key={bp.id} className="p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                    <h4 className="font-medium text-slate-900 flex items-center gap-2">
                      <User className="w-4 h-4" />
                      {bp.participant.fullName}
                    </h4>
                    {bp.isPrimary && (
                      <Badge variant="success" size="sm">
                        Primary Contact
                      </Badge>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-slate-500">Gender:</span>{" "}
                      <span className="text-slate-900">{bp.participant.gender === "MALE" ? "Male" : "Female"}</span>
                    </div>
                    {bp.participant.birthDate && (
                      <div>
                        <span className="text-slate-500">Birth Date:</span>{" "}
                        <span className="text-slate-900">{formatDate(bp.participant.birthDate)}</span>
                      </div>
                    )}
                    {bp.participant.idNumber && (
                      <div>
                        <span className="text-slate-500">ID Number:</span>{" "}
                        <span className="text-slate-900 font-mono">{bp.participant.idNumber}</span>
                      </div>
                    )}
                    {bp.participant.phone && (
                      <div className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span className="text-slate-900">{bp.participant.phone}</span>
                      </div>
                    )}
                    {bp.participant.domicile && (
                      <div>
                        <span className="text-slate-500">Domicile:</span>{" "}
                        <span className="text-slate-900">{bp.participant.domicile}</span>
                      </div>
                    )}
                    {bp.participant.healthHistory && (
                      <div className="sm:col-span-2">
                        <span className="text-slate-500">Health History:</span>{" "}
                        <span className="text-slate-900">{bp.participant.healthHistory}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Notes */}
          {booking.notes && (
            <Card variant="bordered">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-emerald-600" />
                  Additional Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-700 whitespace-pre-wrap">{booking.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Payment Summary */}
          <Card variant="bordered">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-600" />
                Payment Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {!isPrivateTrip && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">
                      Price per person × {booking.participantCount}
                    </span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-slate-100">
                  <span className="font-medium text-slate-900">Total</span>
                  <span className="font-bold text-lg text-emerald-600">{formatPrice(Number(booking.totalAmount))}</span>
                </div>
              </div>

              {/* Payment Status Info */}
              {isPaid && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <div className="flex items-center gap-2 text-emerald-700">
                    <CheckCircle className="w-5 h-5" />
                    <div>
                      <p className="font-medium">Payment Confirmed</p>
                      {booking.paidAt && <p className="text-sm">{formatDateTime(booking.paidAt)}</p>}
                      {booking.paymentMethod && (
                        <p className="text-sm">
                          Method: {booking.paymentMethod === "MIDTRANS" ? "Payment Gateway" : "Manual Transfer"}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {isExpired && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2 text-red-700">
                    <XCircle className="w-5 h-5" />
                    <div>
                      <p className="font-medium">Booking Expired</p>
                      <p className="text-sm">Payment deadline has passed.</p>
                    </div>
                  </div>
                </div>
              )}

              {isCancelled && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2 text-red-700">
                    <XCircle className="w-5 h-5" />
                    <div>
                      <p className="font-medium">Booking Cancelled</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Options - Only for PENDING bookings */}
          {isPending && !deadlinePassed && (
            <Card variant="bordered">
              <CardHeader>
                <CardTitle>Complete Payment</CardTitle>
              </CardHeader>
              <CardContent>
                <PaymentOptions
                  bookingId={booking.id}
                  bookingCode={booking.bookingCode}
                  amount={Number(booking.totalAmount)}
                  customerName={booking.user.name}
                  packageTitle={booking.departure.tourPackage.title}
                />
              </CardContent>
            </Card>
          )}

          {/* Contact Info */}
          <Card variant="bordered">
            <CardHeader>
              <CardTitle>Need Help?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-slate-600">
                If you have any questions about your booking, feel free to contact us.
              </p>
              <div className="space-y-2 text-sm">
                <a
                  href="https://wa.me/6281234567890"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700"
                >
                  <Phone className="w-4 h-4" />
                  WhatsApp: +62 812-3456-7890
                </a>
                <a href="mailto:support@meetandgo.com" className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700">
                  <Mail className="w-4 h-4" />
                  support@meetandgo.com
                </a>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="space-y-3">
            <Link href="/dashboard/bookings" className="block">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="w-4 h-4" />
                Back to My Bookings
              </Button>
            </Link>
            <Link href={`/packages/${booking.departure.tourPackage.slug}`} className="block">
              <Button variant="ghost" className="w-full">
                View Package Details
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}