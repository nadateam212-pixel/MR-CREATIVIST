import { redirect } from "next/navigation";
import { auth } from "@/auth";

export default async function LegacyAdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (session?.user?.role !== "admin") {
    redirect("/dashboard?account=admin-required");
  }

  return children;
}
