import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getPackageBySlug } from "@/services";
import { formatPrice, formatDate } from "@/lib/utils";
import { MapPin, Clock, Calendar, Check, X, Users, ChevronRight } from "lucide-react";
import { TripTypeBadge } from "@/components/ui";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const pkg = await getPackageBySlug(slug);
  if (!pkg) return { title: "Package Not Found" };
  return { title: pkg.title, description: pkg.description.slice(0, 160) };
}

export default async function PackageDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const pkg = await getPackageBySlug(slug);
  if (!pkg) notFound();

  return (
    <div className="py-8">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-slate-500 mb-6">
          <Link href="/" className="hover:text-primary-600">Home</Link>
          <ChevronRight className="w-4 h-4" />
          <Link href="/packages" className="hover:text-primary-600">Packages</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-slate-900">{pkg.title}</span>
        </nav>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Hero Image */}
            <div className="relative h-100 rounded-2xl overflow-hidden">
              {pkg.thumbnail ? (
                <Image src={pkg.thumbnail} alt={pkg.title} fill className="object-cover" priority />
              ) : (
                <div className="w-full h-full bg-linear-to-br from-primary-400 to-accent-green" />
              )}
              <div className="absolute top-4 left-4"><TripTypeBadge type={pkg.tripType} /></div>
            </div>

            {/* Title & Info */}
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-4">{pkg.title}</h1>
              <div className="flex flex-wrap items-center gap-6 text-slate-600">
                <span className="flex items-center gap-2"><MapPin className="w-5 h-5 text-primary-600" />{pkg.location}</span>
                <span className="flex items-center gap-2"><Clock className="w-5 h-5 text-primary-600" />{pkg.duration}</span>
              </div>
            </div>

            {/* Description */}
            <div className="bg-white rounded-2xl p-6">
              <h2 className="text-xl font-semibold mb-4">About This Trip</h2>
              <div className="prose-custom">{pkg.description}</div>
            </div>

            {/* Highlights */}
            {pkg.highlights.length > 0 && (
              <div className="bg-white rounded-2xl p-6">
                <h2 className="text-xl font-semibold mb-4">Highlights</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {pkg.highlights.map((h) => (
                    <div key={h.id} className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl">
                      {h.image && (
                        <div className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0">
                          <Image src={h.image} alt={h.title} fill className="object-cover" />
                        </div>
                      )}
                      <div>
                        <h3 className="font-medium">{h.title}</h3>
                        {h.description && <p className="text-sm text-slate-500">{h.description}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Itinerary */}
            {pkg.itineraries.length > 0 && (
              <div className="bg-white rounded-2xl p-6">
                <h2 className="text-xl font-semibold mb-4">Itinerary</h2>
                <div className="space-y-6">
                  {pkg.itineraries.map((day) => (
                    <div key={day.id} className="border-l-2 border-primary-200 pl-4">
                      <h3 className="font-semibold text-primary-600 mb-2">Day {day.day}{day.title && `: ${day.title}`}</h3>
                      <div className="space-y-2">
                        {day.activities.map((act) => (
                          <div key={act.id} className="flex gap-4 text-sm">
                            <span className="text-slate-500 font-mono w-24 shrink-0">{act.startTime} - {act.endTime}</span>
                            <div>
                              <p className="font-medium">{act.activity}</p>
                              {act.description && <p className="text-slate-500">{act.description}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Included/Excluded */}
            <div className="grid md:grid-cols-2 gap-6">
              {pkg.includedItems.length > 0 && (
                <div className="bg-white rounded-2xl p-6">
                  <h2 className="text-xl font-semibold mb-4 text-primary-600">Included</h2>
                  <ul className="space-y-2">
                    {pkg.includedItems.map((item) => (
                      <li key={item.id} className="flex items-center gap-2">
                        <Check className="w-5 h-5 text-primary-600" />
                        {item.item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {pkg.excludedItems.length > 0 && (
                <div className="bg-white rounded-2xl p-6">
                  <h2 className="text-xl font-semibold mb-4 text-red-600">Not Included</h2>
                  <ul className="space-y-2">
                    {pkg.excludedItems.map((item) => (
                      <li key={item.id} className="flex items-center gap-2">
                        <X className="w-5 h-5 text-red-500" />
                        {item.item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Meeting Points */}
            {pkg.meetingPoints.length > 0 && (
              <div className="bg-white rounded-2xl p-6">
                <h2 className="text-xl font-semibold mb-4">Meeting Points</h2>
                <div className="space-y-3">
                  {pkg.meetingPoints.map((mp) => (
                    <div key={mp.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                      <MapPin className="w-5 h-5 text-primary-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">{mp.name}</p>
                        {mp.address && <p className="text-sm text-slate-500">{mp.address}</p>}
                        {mp.time && <p className="text-sm text-primary-600">Pickup time: {mp.time}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar - Booking */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-white rounded-2xl p-6 shadow-lg">
              <h2 className="text-xl font-semibold mb-4">Book This Trip</h2>

              {pkg.departures.length > 0 ? (
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-slate-500">Available Dates</h3>
                  <div className="space-y-3 max-h-75 overflow-y-auto">
                    {pkg.departures.map((dep) => {
                      const bookedCount = dep._count?.bookings || 0;
                      const maxSeats = dep.maxParticipants || 0;
                      const availableSeats = pkg.tripType === "OPEN_TRIP" ? maxSeats - bookedCount : null;
                      const isFull = pkg.tripType === "OPEN_TRIP" && availableSeats !== null && availableSeats <= 0;

                      return (
                        <div key={dep.id} className={`p-4 border rounded-xl ${isFull ? "bg-slate-50 opacity-60" : "border-primary-200 hover:border-primary-400"} transition-colors`}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="flex items-center gap-2 font-medium">
                              <Calendar className="w-4 h-4 text-primary-600" />
                              {formatDate(dep.departureDate)}
                            </span>
                          </div>
                          {pkg.tripType === "OPEN_TRIP" ? (
                            <>
                              <p className="text-lg font-bold text-primary-600">{dep.pricePerPerson ? formatPrice(Number(dep.pricePerPerson)) : "Contact"}<span className="text-sm font-normal text-slate-500">/person</span></p>
                              <div className="flex items-center gap-1 text-sm text-slate-500 mt-1">
                                <Users className="w-4 h-4" />
                                {isFull ? "Fully Booked" : `${availableSeats} seats left`}
                              </div>
                            </>
                          ) : (
                            <div className="space-y-2">
                              {dep.groups.map((g) => (
                                <div key={g.id} className={`p-2 rounded-lg ${g.isBooked ? "bg-slate-100 opacity-60" : "bg-primary-50"}`}>
                                  <div className="flex justify-between">
                                    <span className="text-sm">Group {g.groupNumber}</span>
                                    <span className="font-semibold text-primary-600">{formatPrice(Number(g.price))}</span>
                                  </div>
                                  <p className="text-xs text-slate-500">{g.isBooked ? "Booked" : `Max ${g.maxParticipants} persons`}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <Link
                    href={`/dashboard/bookings/new?package=${pkg.slug}`}
                    className="block w-full py-3 px-4 bg-primary-600 text-white text-center rounded-xl font-semibold hover:bg-primary-700 transition-colors"
                  >
                    Book Now
                  </Link>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">No departure dates available</p>
                  <Link href="/custom-request" className="text-primary-600 font-medium mt-2 inline-block">Request Custom Date</Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
