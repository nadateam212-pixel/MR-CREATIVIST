import type { Metadata } from "next";
import { PublicFeaturePage } from "@/components/platform/public-feature-page";

export const metadata: Metadata = { title: "Refund Policy" };

export default function RefundPolicyPage() {
  return (
    <PublicFeaturePage
      eyebrow="Purchases"
      title="Refund policy"
      description="Refund rules for course enrollments, digital downloads, physical products, subscriptions, consulting sessions, and disputes."
      primaryHref="/contact"
      primaryLabel="Contact support"
      highlights={[
        "Course, product, consulting, and subscription refund windows",
        "Digital download exceptions, shipment returns, cancellations, and no-shows",
        "Wallet refunds, payment processor refunds, seller chargebacks, and disputes",
        "Support ticket workflow and admin financial review"
      ]}
    />
  );
}
