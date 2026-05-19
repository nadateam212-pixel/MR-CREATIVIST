import type { Metadata } from "next";
import { PublicFeaturePage } from "@/components/platform/public-feature-page";

export const metadata: Metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <PublicFeaturePage
      eyebrow="Legal"
      title="Terms of service"
      description="Platform terms covering accounts, courses, marketplace transactions, consulting sessions, affiliates, payouts, and acceptable use."
      primaryHref="/privacy"
      primaryLabel="Privacy policy"
      highlights={[
        "User, instructor, seller, consultant, affiliate, and admin responsibilities",
        "Content ownership, moderation, bans, disputes, and refunds",
        "Payment processing, commissions, wallet balances, taxes, and withdrawals",
        "API usage, security, service availability, and liability boundaries"
      ]}
    />
  );
}
