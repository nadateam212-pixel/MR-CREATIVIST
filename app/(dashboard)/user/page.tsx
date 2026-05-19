import type { Metadata } from "next";
import { PlatformDashboard } from "@/components/platform/platform-dashboard";

export const metadata: Metadata = {
  title: "User Dashboard"
};

export default function UserDashboardPage() {
  return <PlatformDashboard role="user" />;
}
