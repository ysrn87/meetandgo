import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { formatPrice, formatDate } from "@/lib/utils";
import { FileText, MapPin, Calendar, Users, ArrowRight } from "lucide-react";
import { CustomRequestStatusBadge, Button } from "@/components/ui";

async function getUserRequests(userId: string) {
  return prisma.customTourRequest.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

export default async function CustomerRequestsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const requests = await getUserRequests(user.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Custom Requests</h1>
          <p className="text-slate-600">Track your custom tour requests</p>
        </div>
        <Link href="/custom-request">
          <Button>New Request</Button>
        </Link>
      </div>

      {requests.length > 0 ? (
        <div className="space-y-4">
          {requests.map((request) => (
            <Link
              key={request.id}
              href={`/dashboard/custom-requests/${request.id}`}
              className="block bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-mono text-sm font-medium text-slate-900">{request.requestCode}</span>
                    <CustomRequestStatusBadge status={request.status} />
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-slate-600 flex-wrap">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {request.destination}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {formatDate(request.departureDate)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {request.participantCount} pax
                    </span>
                  </div>

                  <p className="text-sm text-slate-500">{request.duration}</p>
                </div>

                <div className="text-right">
                  {request.finalPrice ? (
                    <div>
                      <p className="text-xs text-slate-500">Final Price</p>
                      <p className="text-lg font-bold text-primary-600">{formatPrice(Number(request.finalPrice))}</p>
                    </div>
                  ) : request.estimatedPrice ? (
                    <div>
                      <p className="text-xs text-slate-500">Est. Price</p>
                      <p className="text-lg font-semibold text-amber-600">~{formatPrice(Number(request.estimatedPrice))}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400">Awaiting quote</p>
                  )}
                  <p className="text-xs text-slate-400 mt-2">{formatDate(request.createdAt)}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
          <FileText className="w-12 h-12 mx-auto mb-4 text-slate-300" />
          <h3 className="font-medium text-slate-900 mb-2">No custom requests yet</h3>
          <p className="text-slate-500 mb-6">Create a custom tour request for a personalized trip</p>
          <Link href="/custom-request">
            <Button>
              Create Custom Request <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
