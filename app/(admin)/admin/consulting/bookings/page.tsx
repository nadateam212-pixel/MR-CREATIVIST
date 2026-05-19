import { WorkspacePage } from "@/components/layout/workspace-page";

export default function AdminBookingsPage() {
  return <WorkspacePage title="Bookings" description="Booking queue, cancellations, reschedules, meeting links, billing status, and client satisfaction." tags={["Calendar", "Billing", "Satisfaction"]} />;
}
