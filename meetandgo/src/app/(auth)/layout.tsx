import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-linear-to-br from-primary-600 to-teal-700 p-12 flex-col justify-between">
        <Link href="/" className="flex items-center gap-2 text-2xl font-bold text-white">
          <svg className="w-10 h-10" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="14" fill="white" opacity="0.2" />
            <path d="M16 6L20 14H12L16 6Z" fill="white" />
            <circle cx="16" cy="20" r="4" fill="white" />
          </svg>
          MeetAndGo
        </Link>
        <div>
          <h1 className="text-4xl font-bold text-white mb-4">Discover Indonesia with Us</h1>
          <p className="text-primary-100 text-lg">Join thousands of travelers exploring the beautiful archipelago through our curated tour experiences.</p>
        </div>
        <p className="text-primary-200 text-sm">© {new Date().getFullYear()} MeetAndGo. All rights reserved.</p>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-slate-50">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
