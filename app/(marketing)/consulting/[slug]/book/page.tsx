import type { Metadata } from "next";
import { PublicFeaturePage } from "@/components/platform/public-feature-page";

export const metadata: Metadata = { title: "Book Consultant" };

export default function ConsultantBookPage() {
  return (
    <PublicFeaturePage
      eyebrow="Consulting booking"
      title="Book a consulting session"
      description="Choose a consultant, time slot, duration, topic, payment method, and meeting preference."
      primaryHref="/consulting/success"
      primaryLabel="Confirm booking"
      secondaryHref="/consulting"
      secondaryLabel="Browse consultants"
      highlights={[
        "Availability calendar, timezone display, rate, and session duration",
        "Topic intake, client notes, attachments, and meeting provider",
        "Wallet, Stripe, PayPal, and confirmation email integration points",
        "Consultant confirmation, generated meeting URL, reminders, and review request"
      ]}
      workflow={["Pick time", "Describe topic", "Pay securely", "Receive meeting link", "Rate the completed session"]}
    />
  );
}
