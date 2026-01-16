import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { formatPrice, formatDate } from "@/lib/utils";
import { ArrowLeft, MapPin, Calendar, Users, Clock, User, CheckCircle, AlertTriangle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CustomRequestStatusBadge } from "@/components/ui";

async function getRequest(id: string, userId: string) {
  return prisma.customTourRequest.findFirst({
    where: { id, userId },
    include: {
      tourGuide: { select: { name: true, phone: true } },
      priceHistory: { orderBy: { createdAt: "desc" } },
    },
  });
}

export default async function CustomerRequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const request = await getRequest(id, user.id);
  if (!request) notFound();

  const isPending = request.status === "PENDING";
  const isInReview = request.status === "IN_REVIEW";
  const isAccepted = request.status === "ACCEPTED";
  const isRejected = request.status === "REJECTED";

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/custom-requests" className="p-2 rounded-lg hover:bg-slate-100">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-slate-900">{request.requestCode}</h1>
            <CustomRequestStatusBadge status={request.status} />
          </div>
          <p className="text-slate-600">Submitted on {formatDate(request.createdAt)}</p>
        </div>
      </div>

      {/* Status Messages */}
      {isPending && (
        <Card variant="bordered" className="border-blue-200 bg-blue-50">
          <CardContent className="flex items-start gap-4">
            <Clock className="w-6 h-6 text-blue-500 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-blue-800">Request Submitted</h3>
              <p className="text-blue-700">Your request is being reviewed by our team. We'll get back to you with a quote soon.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {isInReview && request.estimatedPrice && (
        <Card variant="bordered" className="border-amber-200 bg-amber-50">
          <CardContent className="flex items-start gap-4">
            <AlertTriangle className="w-6 h-6 text-amber-500 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-amber-800">Quote Available</h3>
              <p className="text-amber-700">Our estimated price for your trip is <strong>{formatPrice(Number(request.estimatedPrice))}</strong>. This may change as we finalize details.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {isAccepted && request.finalPrice && (
        <Card variant="bordered" className="border-emerald-200 bg-emerald-50">
          <CardContent className="flex items-start gap-4">
            <CheckCircle className="w-6 h-6 text-emerald-500 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-emerald-800">Ready to Book!</h3>
              <p className="text-emerald-700">Your custom tour has been confirmed at <strong>{formatPrice(Number(request.finalPrice))}</strong>. Please proceed with payment to secure your trip.</p>
              <p className="text-sm text-emerald-600 mt-2">Transfer to: Bank BCA 1234567890 a/n PT MeetAndGo Indonesia</p>
            </div>
          </CardContent>
        </Card>
      )}

      {isRejected && (
        <Card variant="bordered" className="border-red-200 bg-red-50">
          <CardContent className="flex items-start gap-4">
            <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-red-800">Request Declined</h3>
              <p className="text-red-700">Unfortunately, we're unable to accommodate this request. Please contact us for more details or submit a new request.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Trip Details */}
      <Card variant="bordered">
        <CardHeader><CardTitle className="flex items-center gap-2"><MapPin className="w-5 h-5" /> Trip Details</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-slate-500">Destination</p>
              <p className="font-medium">{request.destination}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Duration</p>
              <p className="font-medium">{request.duration}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Departure Date</p>
              <p className="font-medium flex items-center gap-2"><Calendar className="w-4 h-4" />{formatDate(request.departureDate)}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Participants</p>
              <p className="font-medium flex items-center gap-2"><Users className="w-4 h-4" />{request.participantCount} people</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-sm text-slate-500">Meeting Point</p>
              <p className="font-medium">{request.meetingPoint}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pricing */}
      <Card variant="bordered">
        <CardHeader><CardTitle>Pricing</CardTitle></CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-lg">
              <p className="text-sm text-slate-500">Estimated Price</p>
              <p className="text-xl font-bold text-slate-900">
                {request.estimatedPrice ? formatPrice(Number(request.estimatedPrice)) : "Pending"}
              </p>
            </div>
            <div className="p-4 bg-emerald-50 rounded-lg">
              <p className="text-sm text-emerald-600">Final Price</p>
              <p className="text-xl font-bold text-emerald-700">
                {request.finalPrice ? formatPrice(Number(request.finalPrice)) : "TBD"}
              </p>
            </div>
          </div>

          {request.priceHistory.length > 1 && (
            <div className="mt-4">
              <p className="text-sm font-medium text-slate-700 mb-2">Price History</p>
              <div className="space-y-2">
                {request.priceHistory.map((ph, index) => (
                  <div key={ph.id} className="flex justify-between text-sm p-2 bg-slate-50 rounded">
                    <span>{formatPrice(Number(ph.estimatedPrice))}</span>
                    <span className="text-slate-500">{formatDate(ph.createdAt)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tour Guide */}
      {request.tourGuide && (
        <Card variant="bordered">
          <CardHeader><CardTitle className="flex items-center gap-2"><User className="w-5 h-5" /> Your Tour Guide</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                <User className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="font-medium text-slate-900">{request.tourGuide.name}</p>
                {request.tourGuide.phone && (
                  <a href={`tel:${request.tourGuide.phone}`} className="text-sm text-emerald-600 hover:underline">
                    {request.tourGuide.phone}
                  </a>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      {request.notes && (
        <Card variant="bordered">
          <CardHeader><CardTitle>Your Notes</CardTitle></CardHeader>
          <CardContent>
            <p className="text-slate-600 whitespace-pre-wrap">{request.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Admin Notes */}
      {request.adminNotes && (
        <Card variant="bordered">
          <CardHeader><CardTitle>Notes from MeetAndGo</CardTitle></CardHeader>
          <CardContent>
            <p className="text-slate-600 whitespace-pre-wrap">{request.adminNotes}</p>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex gap-4">
        <Link href="/dashboard/custom-requests" className="flex-1">
          <button className="w-full px-4 py-3 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors">
            Back to Requests
          </button>
        </Link>
        {isAccepted && request.finalPrice && (
          <a 
            href={`https://wa.me/6281234567890?text=Hi, saya ingin konfirmasi pembayaran untuk custom request ${request.requestCode}`}
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
