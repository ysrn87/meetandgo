"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  CalendarCheck,
  MessageSquare,
  Users,
  User,
  Package,
  Settings,
  ChevronLeft,
  Menu,
} from "lucide-react";

interface SidebarProps {
  isAdmin?: boolean;
  isOpen: boolean;
  onToggle: () => void;
}

const customerLinks = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/bookings", label: "My Bookings", icon: CalendarCheck },
  { href: "/dashboard/custom-requests", label: "Custom Requests", icon: MessageSquare },
  { href: "/dashboard/participants", label: "Participants", icon: Users },
  { href: "/dashboard/profile", label: "Profile", icon: User },
];

const adminLinks = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/packages", label: "Packages", icon: Package },
  { href: "/admin/bookings", label: "Bookings", icon: CalendarCheck },
  { href: "/admin/custom-requests", label: "Custom Requests", icon: MessageSquare },
  { href: "/admin/profile", label: "Profile", icon: Settings },
];

export function DashboardSidebar({ isAdmin = false, isOpen, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const links = isAdmin ? adminLinks : customerLinks;

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-screen bg-white border-r border-slate-200 transition-all duration-300",
          "lg:sticky lg:z-auto",
          isOpen ? "w-64 translate-x-0" : "w-64 -translate-x-full lg:w-20 lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-100">
          <Link
            href="/"
            className={cn(
              "flex items-center gap-2 text-emerald-600 font-bold",
              !isOpen && "lg:justify-center"
            )}
          >
            <svg className="w-8 h-8 flex-shrink-0" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="16" r="14" fill="currentColor" opacity="0.1" />
              <path d="M16 6L20 14H12L16 6Z" fill="currentColor" />
              <circle cx="16" cy="20" r="4" fill="currentColor" />
            </svg>
            {(isOpen || typeof window !== "undefined" && window.innerWidth < 1024) && (
              <span className="text-lg">MeetAndGo</span>
            )}
          </Link>
          
          {/* Mobile Close Button */}
          <button
            onClick={onToggle}
            className="p-2 rounded-lg hover:bg-slate-100 lg:hidden"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-emerald-50 text-emerald-600"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                  !isOpen && "lg:justify-center lg:px-2"
                )}
                title={!isOpen ? link.label : undefined}
              >
                <link.icon className="w-5 h-5 flex-shrink-0" />
                {(isOpen || typeof window !== "undefined" && window.innerWidth < 1024) && (
                  <span>{link.label}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Toggle Button (Desktop) */}
        <button
          onClick={onToggle}
          className="hidden lg:flex absolute -right-3 top-20 w-6 h-6 bg-white border border-slate-200 rounded-full items-center justify-center shadow-sm hover:bg-slate-50"
        >
          <ChevronLeft
            className={cn(
              "w-4 h-4 text-slate-400 transition-transform",
              !isOpen && "rotate-180"
            )}
          />
        </button>
      </aside>
    </>
  );
}

export function DashboardHeader({ onMenuClick }: { onMenuClick: () => void }) {
  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center px-4 lg:px-6">
      <button
        onClick={onMenuClick}
        className="p-2 rounded-lg hover:bg-slate-100 lg:hidden"
      >
        <Menu className="w-5 h-5" />
      </button>
    </header>
  );
}
