import type { Metadata } from "next";
import { PlatformDashboard } from "@/components/platform/platform-dashboard";

export const metadata: Metadata = {
  title: "User Dashboard"
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function DashboardPage() {
  return <PlatformDashboard role="user" />;
}
