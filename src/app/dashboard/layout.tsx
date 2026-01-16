import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Header, Sidebar, MobileSidebar } from "@/components/layout";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login?callbackUrl=/dashboard");
  if (session.user.role === "ADMIN") redirect("/admin");

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <div className="flex">
        <Sidebar variant="customer" />
        <main className="flex-1 min-w-0">
          <MobileSidebar variant="customer" />
          <div className="p-4 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
