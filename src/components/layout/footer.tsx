import Link from "next/link";
import { MapPin, Phone, Mail, Instagram, Facebook } from "lucide-react";
import { FaTiktok, FaWhatsapp } from 'react-icons/fa';

export function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300">
      <div className="container mx-auto px-4 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <Link href="/" className="flex items-center gap-2 text-xl font-bold text-white mb-4">
              <svg className="w-8 h-8 text-emerald-500" viewBox="0 0 32 32" fill="none">
                <circle cx="16" cy="16" r="14" fill="currentColor" opacity="0.2" />
                <path d="M16 6L20 14H12L16 6Z" fill="currentColor" />
                <circle cx="16" cy="20" r="4" fill="currentColor" />
              </svg>
              MeetAndGo
            </Link>
            <p className="text-sm text-slate-400 mb-4">
              Discover the beauty of Indonesia with our curated travel experiences. 
              From open trips to private tours, we make your journey unforgettable.
            </p>
            <div className="flex gap-4">
              <a href="https://www.tiktok.com/@meetandgo" className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors">
                <FaTiktok className="w-5 h-5" />
              </a>
              <a href="https://www.instagram.com/meetandgo.pim/" className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="http://wa.me/6281236777781" className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors">
                <FaWhatsapp className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li><Link href="/packages" className="text-sm hover:text-emerald-400 transition-colors">Tour Packages</Link></li>
              <li><Link href="/custom-request" className="text-sm hover:text-emerald-400 transition-colors">Custom Trip</Link></li>
              <li><Link href="/about" className="text-sm hover:text-emerald-400 transition-colors">About Us</Link></li>
              <li><Link href="/faq" className="text-sm hover:text-emerald-400 transition-colors">FAQ</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Popular Destinations</h4>
            <ul className="space-y-2">
              <li><Link href="/packages?location=bali" className="text-sm hover:text-emerald-400 transition-colors">Bali</Link></li>
              <li><Link href="/packages?location=lombok" className="text-sm hover:text-emerald-400 transition-colors">Lombok</Link></li>
              <li><Link href="/packages?location=yogyakarta" className="text-sm hover:text-emerald-400 transition-colors">Yogyakarta</Link></li>
              <li><Link href="/packages?location=komodo" className="text-sm hover:text-emerald-400 transition-colors">Komodo</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Contact Us</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-sm">
                <MapPin className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <span>Jl. Wijaya Kusuma, Sekarpuro Residence, Sekaran, Sekarpuro, Kec. Pakis, Kabupaten Malang, Jawa Timur, Indonesia 65154</span>
              </li>
              <li className="flex items-center gap-3 text-sm">
                <Phone className="w-5 h-5 text-emerald-500 shrink-0" />
                <a href="tel:+6281234567890" className="hover:text-emerald-400 transition-colors">+62 812 36 7777 81</a>
              </li>
              <li className="flex items-center gap-3 text-sm">
                <Mail className="w-5 h-5 text-emerald-500 shrink-0" />
                <a href="mailto:hello@meetandgo.id" className="hover:text-emerald-400 transition-colors">hello@meetandgo.id</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-slate-500">&copy; {new Date().getFullYear()} MeetAndGo. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="text-sm text-slate-500 hover:text-slate-300 transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="text-sm text-slate-500 hover:text-slate-300 transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
