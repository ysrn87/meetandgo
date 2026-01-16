import { prisma } from "@/lib/db";
import { formatPrice } from "@/lib/utils";
import { Package, Calendar, FileText, TrendingUp, Users, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import Link from "next/link";

async function getStats() {
  const [totalPackages, activeBookings, pendingRequests, recentBookings] = await Promise.all([
    prisma.tourPackage.count({ where: { isActive: true } }),
    prisma.booking.count({ where: { status: { in: ["PENDING", "PAYMENT_RECEIVED", "PROCESSED", "ONGOING"] } } }),
    prisma.customTourRequest.count({ where: { status: { in: ["PENDING", "IN_REVIEW"] } } }),
    prisma.booking.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { name: true } }, departure: { include: { tourPackage: { select: { title: true } } } } },
    }),
  ]);
  return { totalPackages, activeBookings, pendingRequests, recentBookings };
}

export default async function AdminDashboard() {
  const { totalPackages, activeBookings, pendingRequests, recentBookings } = await getStats();

  const stats = [
    { label: "Active Packages", value: totalPackages, icon: Package, color: "bg-blue-500", href: "/admin/packages" },
    { label: "Active Bookings", value: activeBookings, icon: Calendar, color: "bg-primary-500", href: "/admin/bookings" },
    { label: "Pending Requests", value: pendingRequests, icon: FileText, color: "bg-amber-500", href: "/admin/custom-requests" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
        <p className="text-slate-600">Welcome back! Here is an overview of your business.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card variant="elevated" className="hover:shadow-xl transition-shadow cursor-pointer">
              <CardContent className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${stat.color}`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">{stat.label}</p>
                  <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Card variant="bordered">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-slate-400" />
            Recent Bookings
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentBookings.length > 0 ? (
            <div className="space-y-4">
              {recentBookings.map((booking) => (
                <Link key={booking.id} href={`/admin/bookings/${booking.id}`} className="flex items-center justify-between p-4 rounded-lg hover:bg-slate-50 transition-colors">
                  <div>
                    <p className="font-medium text-slate-900">{booking.departure.tourPackage.title}</p>
                    <p className="text-sm text-slate-500">by {booking.user.name} • {booking.bookingCode}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-primary-600">{formatPrice(Number(booking.totalAmount))}</p>
                    <p className="text-xs text-slate-400">{booking.status}</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-center text-slate-500 py-8">No bookings yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
