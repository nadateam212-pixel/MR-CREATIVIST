import type { Metadata } from "next";
import { PublicFeaturePage } from "@/components/platform/public-feature-page";

export const metadata: Metadata = { title: "Booking Confirmed" };

export default function ConsultingSuccessPage() {
  return (
    <PublicFeaturePage
      eyebrow="Booking confirmed"
      title="Your consulting session is scheduled"
      description="Confirmation, calendar, meeting link, payment receipt, reminders, and pre-session notes are ready."
      primaryHref="/dashboard"
      primaryLabel="Open dashboard"
      highlights={[
        "Session status, consultant details, topic, duration, and local time",
        "Calendar-ready session data and reminder notifications",
        "Payment receipt, wallet transaction, and cancellation policy",
        "Post-session rating, review, and consultant payout triggers"
      ]}
    />
  );
}
