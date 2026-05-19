import type { Metadata } from "next";
import { PublicFeaturePage } from "@/components/platform/public-feature-page";

export const metadata: Metadata = { title: "Join Affiliate Program" };

export default function AffiliateRegisterPage() {
  return (
    <PublicFeaturePage
      eyebrow="Affiliate registration"
      title="Join the affiliate program"
      description="Apply for referral access with profile details, payout method, compliance agreement, and campaign preferences."
      primaryHref="/register"
      primaryLabel="Create account"
      highlights={[
        "Profile intake, traffic sources, campaign niches, and agreement acceptance",
        "Generated referral code, link builder, and promotional asset library",
        "Payout method setup and wallet activation",
        "Approval queue visibility for admins and affiliates"
      ]}
    />
  );
}
