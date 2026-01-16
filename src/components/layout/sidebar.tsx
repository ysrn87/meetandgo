"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Calendar, Users, FileText, Settings, Package, ClipboardList } from "lucide-react";

interface SidebarLink {
  href: string;
  label: string;
  icon: React.ElementType;
}

const customerLinks: SidebarLink[] = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/bookings", label: "My Bookings", icon: Calendar },
  { href: "/dashboard/custom-requests", label: "Custom Requests", icon: FileText },
  { href: "/dashboard/participants", label: "Saved Participants", icon: Users },
  { href: "/dashboard/profile", label: "Profile Settings", icon: Settings },
];

const adminLinks: SidebarLink[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/packages", label: "Tour Packages", icon: Package },
  { href: "/admin/bookings", label: "Bookings", icon: Calendar },
  { href: "/admin/custom-requests", label: "Custom Requests", icon: ClipboardList },
  { href: "/admin/profile", label: "Profile Settings", icon: Settings },
];

interface SidebarProps {
  variant: "customer" | "admin";
}

export function Sidebar({ variant }: SidebarProps) {
  const pathname = usePathname();
  const links = variant === "admin" ? adminLinks : customerLinks;

  return (
    <aside className="w-64 bg-white border-r border-slate-200 min-h-[calc(100vh-4rem)] hidden lg:block">
      <nav className="p-4 space-y-1">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href || (link.href !== "/dashboard" && link.href !== "/admin" && pathname.startsWith(link.href));
          return (
            <Link key={link.href} href={link.href} className={cn("flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors", isActive ? "bg-emerald-50 text-emerald-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900")}>
              <Icon className={cn("w-5 h-5", isActive ? "text-emerald-600" : "text-slate-400")} />
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

export function MobileSidebar({ variant }: SidebarProps) {
  const pathname = usePathname();
  const links = variant === "admin" ? adminLinks : customerLinks;
  return (
    <div className="lg:hidden bg-white border-b border-slate-200 overflow-x-auto">
      <nav className="flex p-2 gap-1 min-w-max">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href || (link.href !== "/dashboard" && link.href !== "/admin" && pathname.startsWith(link.href));
          return (
            <Link key={link.href} href={link.href} className={cn("flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors", isActive ? "bg-emerald-50 text-emerald-700" : "text-slate-600 hover:bg-slate-50")}>
              <Icon className={cn("w-4 h-4", isActive ? "text-emerald-600" : "text-slate-400")} />
              {link.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
