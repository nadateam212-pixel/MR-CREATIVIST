import type { Metadata } from "next";
import { PlatformDashboard } from "@/components/platform/platform-dashboard";

export const metadata: Metadata = {
  title: "User Dashboard"
};

export default function DashboardPage() {
  return <PlatformDashboard role="user" />;
}
