import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (session?.user?.role !== "admin") {
    redirect("/dashboard?account=admin-required");
  }

  return <DashboardShell user={session.user}>{children}</DashboardShell>;
}
