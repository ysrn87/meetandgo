import Link from "next/link";
import Image from "next/image";
import { getPackages } from "@/services";
import { formatPrice } from "@/lib/utils";
import { MapPin, Clock, Users, ArrowRight, Star, Shield, Heart } from "lucide-react";
import { TripTypeBadge } from "@/components/ui";

export default async function HomePage() {
  const { packages } = await getPackages({ limit: 6 });

  return (
    <>
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-linear-to-br from-slate-900 via-slate-800 to-primary-900">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />
        </div>

        <div className="container mx-auto px-4 lg:px-8 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <span className="inline-block px-4 py-2 bg-primary-500/20 text-primary-300 rounded-full text-sm font-medium mb-6">
              🌴 Explore Indonesia with Us
            </span>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
              Your Next Adventure
              <span className="block text-primary-400">Starts Here</span>
            </h1>
            <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto">
              Discover breathtaking destinations across Indonesia. From pristine beaches
              to ancient temples, we curate unforgettable experiences just for you.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/packages"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600 transition-all hover:scale-105 shadow-lg shadow-primary-500/25"
              >
                Explore Packages
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/custom-request"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 text-white rounded-xl font-semibold hover:bg-white/20 transition-all backdrop-blur-sm border border-white/20"
              >
                Plan Custom Trip
              </Link>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center pt-2">
            <div className="w-1 h-3 bg-white/50 rounded-full" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Shield, title: "Safe & Trusted", desc: "Licensed tour operator with years of experience" },
              { icon: Heart, title: "Curated Experiences", desc: "Handpicked destinations and local guides" },
              { icon: Star, title: "Best Value", desc: "Competitive pricing with no hidden fees" },
            ].map((feature, i) => (
              <div key={i} className="text-center p-8 rounded-2xl bg-slate-50 hover:bg-primary-50 transition-colors">
                <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-primary-100 flex items-center justify-center">
                  <feature.icon className="w-8 h-8 text-primary-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-slate-600">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Packages */}
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Popular Destinations</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Explore our most loved tour packages, carefully crafted for an unforgettable experience
            </p>
          </div>

          {packages.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {packages.map((pkg) => (
                <Link
                  key={pkg.id}
                  href={`/packages/${pkg.slug}`}
                  className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300"
                >
                  <div className="relative h-56 overflow-hidden">
                    {pkg.thumbnail ? (
                      <Image
                        src={pkg.thumbnail}
                        alt={pkg.title}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-linear-to-br from-primary-400 to-accent-green" />
                    )}
                    <div className="absolute top-4 left-4">
                      <TripTypeBadge type={pkg.tripType} />
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-semibold mb-2 group-hover:text-primary-600 transition-colors">
                      {pkg.title}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-slate-500 mb-4">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {pkg.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {pkg.duration}
                      </span>
                    </div>
                    {pkg.highlights.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {pkg.highlights.slice(0, 3).map((h) => (
                          <span key={h.id} className="text-xs px-2 py-1 bg-slate-100 rounded-full text-slate-600">
                            {h.title}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                      {pkg.minPrice ? (
                        <div>
                          <span className="text-sm text-slate-500">Starting from</span>
                          <p className="text-lg font-bold text-primary-600">{formatPrice(pkg.minPrice)}</p>
                        </div>
                      ) : (
                        <span className="text-slate-500">Contact for price</span>
                      )}
                      <span className="text-primary-600 font-medium group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                        View Details <ArrowRight className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500">
              No packages available yet. Check back soon!
            </div>
          )}

          <div className="text-center mt-12">
            <Link
              href="/packages"
              className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition-colors"
            >
              View All Packages
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary-600">
        <div className="container mx-auto px-4 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Have a Specific Destination in Mind?
          </h2>
          <p className="text-primary-100 mb-8 max-w-2xl mx-auto">
            We can create a custom tour package tailored to your preferences.
            Tell us where you want to go, and we will handle the rest!
          </p>
          <Link
            href="/custom-request"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-primary-600 rounded-xl font-semibold hover:bg-primary-50 transition-colors"
          >
            Request Custom Trip
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </>
  );
}
