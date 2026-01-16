import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatPrice, formatDate } from "@/lib/utils";
import { ArrowLeft, User, Calendar, MapPin, Users, Clock, DollarSign } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CustomRequestStatusBadge } from "@/components/ui";
import { CustomRequestStatusForm } from "@/components/admin/custom-request-status-form";

async function getRequest(id: string) {
  return prisma.customTourRequest.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true } },
      tourGuide: { select: { id: true, name: true, email: true, phone: true } },
      priceHistory: { orderBy: { createdAt: "desc" } },
    },
  });
}

async function getTourGuides() {
  return prisma.user.findMany({ where: { role: "TOUR_GUIDE" }, select: { id: true, name: true } });
}

export default async function AdminCustomRequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [request, tourGuides] = await Promise.all([getRequest(id), getTourGuides()]);
  if (!request) notFound();

  const isTerminal = ["COMPLETED", "REJECTED", "CANCELLED"].includes(request.status);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/custom-requests" className="p-2 rounded-lg hover:bg-slate-100"><ArrowLeft className="w-5 h-5" /></Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">{request.requestCode}</h1>
            <CustomRequestStatusBadge status={request.status} />
          </div>
          <p className="text-slate-600">Created {formatDate(request.createdAt)}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card variant="bordered">
          <CardHeader><CardTitle className="flex items-center gap-2"><User className="w-5 h-5" /> Customer</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div><p className="text-sm text-slate-500">Name</p><p className="font-medium">{request.user.name}</p></div>
            <div><p className="text-sm text-slate-500">Email</p><p className="font-medium">{request.user.email || "-"}</p></div>
            <div><p className="text-sm text-slate-500">Phone</p><p className="font-medium">{request.user.phone || "-"}</p></div>
          </CardContent>
        </Card>

        <Card variant="bordered">
          <CardHeader><CardTitle className="flex items-center gap-2"><MapPin className="w-5 h-5" /> Trip Details</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div><p className="text-sm text-slate-500">Destination</p><p className="font-medium">{request.destination}</p></div>
            <div><p className="text-sm text-slate-500">Duration</p><p className="font-medium">{request.duration}</p></div>
            <div><p className="text-sm text-slate-500">Departure Date</p><p className="font-medium flex items-center gap-2"><Calendar className="w-4 h-4" />{formatDate(request.departureDate)}</p></div>
            <div><p className="text-sm text-slate-500">Participants</p><p className="font-medium flex items-center gap-2"><Users className="w-4 h-4" />{request.participantCount} people</p></div>
            <div><p className="text-sm text-slate-500">Meeting Point</p><p className="font-medium">{request.meetingPoint}</p></div>
          </CardContent>
        </Card>
      </div>

      <Card variant="bordered">
        <CardHeader><CardTitle className="flex items-center gap-2"><DollarSign className="w-5 h-5" /> Pricing</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 bg-amber-50 rounded-lg">
              <p className="text-sm text-amber-700">Estimated Price</p>
              <p className="text-xl font-bold text-amber-900">{request.estimatedPrice ? formatPrice(Number(request.estimatedPrice)) : "Not set"}</p>
            </div>
            <div className="p-4 bg-primary-50 rounded-lg">
              <p className="text-sm text-primary-700">Final Price</p>
              <p className="text-xl font-bold text-primary-900">{request.finalPrice ? formatPrice(Number(request.finalPrice)) : "Not set"}</p>
            </div>
          </div>

          {request.priceHistory.length > 0 && (
            <div>
              <p className="text-sm font-medium text-slate-700 mb-2">Price History</p>
              <div className="space-y-2">
                {request.priceHistory.map((ph) => (
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

      {request.notes && (
        <Card variant="bordered">
          <CardHeader><CardTitle>Customer Notes</CardTitle></CardHeader>
          <CardContent><p className="text-slate-600 whitespace-pre-wrap">{request.notes}</p></CardContent>
        </Card>
      )}

      {request.tourGuide && (
        <Card variant="bordered">
          <CardHeader><CardTitle>Assigned Tour Guide</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                <User className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <p className="font-medium">{request.tourGuide.name}</p>
                <p className="text-sm text-slate-500">{request.tourGuide.phone || request.tourGuide.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {!isTerminal && (
        <Card variant="bordered">
          <CardHeader><CardTitle>Update Request</CardTitle></CardHeader>
          <CardContent>
            <CustomRequestStatusForm
              requestId={request.id}
              currentStatus={request.status}
              currentEstimatedPrice={request.estimatedPrice ? Number(request.estimatedPrice) : undefined}
              currentFinalPrice={request.finalPrice ? Number(request.finalPrice) : undefined}
              currentTourGuideId={request.tourGuide?.id}
              tourGuides={tourGuides}
            />
          </CardContent>
        </Card>
      )}

      {request.adminNotes && (
        <Card variant="bordered">
          <CardHeader><CardTitle>Admin Notes</CardTitle></CardHeader>
          <CardContent><p className="text-slate-600 whitespace-pre-wrap">{request.adminNotes}</p></CardContent>
        </Card>
      )}
    </div>
  );
}
