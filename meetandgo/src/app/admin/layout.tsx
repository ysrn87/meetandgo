import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Header, Sidebar, MobileSidebar } from "@/components/layout";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login?callbackUrl=/admin");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <div className="flex">
        <Sidebar variant="admin" />
        <main className="flex-1 min-w-0">
          <MobileSidebar variant="admin" />
          <div className="p-4 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
