import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  let session = null;

  try {
    session = await auth();
  } catch {
    redirect("/login?error=session");
  }

  if (!session?.user) {
    redirect("/login");
  }

  return <DashboardShell user={session.user}>{children}</DashboardShell>;
}
