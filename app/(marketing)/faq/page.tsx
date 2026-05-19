import type { Metadata } from "next";
import { PublicFeaturePage } from "@/components/platform/public-feature-page";

export const metadata: Metadata = { title: "FAQ" };

export default function FaqPage() {
  return (
    <PublicFeaturePage
      eyebrow="FAQ"
      title="Frequently asked questions"
      description="Answers for learners, instructors, sellers, consultants, affiliates, payments, wallet withdrawals, and account security."
      primaryHref="/help-center"
      primaryLabel="Help center"
      highlights={[
        "Account, billing, course, marketplace, consulting, and affiliate categories",
        "Searchable help content, support ticket escalation, and contact links",
        "Refund, dispute, withdrawal, and certificate verification guidance",
        "Role-specific onboarding and platform policy answers"
      ]}
    />
  );
}
