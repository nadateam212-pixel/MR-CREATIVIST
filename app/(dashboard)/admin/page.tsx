import type { Metadata } from "next";
import { PlatformDashboard } from "@/components/platform/platform-dashboard";

export const metadata: Metadata = {
  title: "Admin Dashboard"
};

export default function AdminDashboardIndexPage() {
  return <PlatformDashboard role="admin" />;
}
