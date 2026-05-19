import { WorkspacePage } from "@/components/layout/workspace-page";

export default function AdminUserDetailPage() {
  return <WorkspacePage title="User details" description="Profile, activity log, enrollments, orders, bookings, payouts, badges, and moderation history." tags={["Activity", "Orders", "Moderation"]} />;
}
