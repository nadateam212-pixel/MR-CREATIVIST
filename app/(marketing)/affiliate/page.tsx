import type { Metadata } from "next";
import { PublicFeaturePage } from "@/components/platform/public-feature-page";

export const metadata: Metadata = { title: "Affiliate Program" };

export default function AffiliatePage() {
  return (
    <PublicFeaturePage
      eyebrow="Affiliate program"
      title="Earn by sharing courses, products, and consulting"
      description="Join the referral program, generate tracked links, attribute purchases, calculate commissions, and withdraw earnings."
      primaryHref="/affiliate/register"
      primaryLabel="Join affiliate"
      highlights={[
        "Unique referral links, click tracking, cookie attribution, and conversion reporting",
        "Course, product, subscription, and consulting commission sources",
        "Fraud checks, payout thresholds, wallet transactions, and withdrawal requests",
        "Affiliate dashboard with earnings, campaigns, reports, and promotional assets"
      ]}
      workflow={["Create affiliate profile", "Generate referral link", "Share campaign", "Track conversion", "Withdraw commission"]}
    />
  );
}
