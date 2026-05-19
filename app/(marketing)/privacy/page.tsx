import type { Metadata } from "next";
import { PublicFeaturePage } from "@/components/platform/public-feature-page";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <PublicFeaturePage
      eyebrow="Privacy"
      title="Privacy policy"
      description="Data practices for accounts, purchases, learning progress, consulting sessions, referrals, uploads, analytics, and integrations."
      primaryHref="/terms"
      primaryLabel="Terms"
      highlights={[
        "Collected data, processing purposes, retention, deletion, and export rights",
        "Payment, upload, email, analytics, AI, and webhook processors",
        "GDPR tooling, consent preferences, security controls, and audit logs",
        "Cookie usage for sessions, affiliate attribution, analytics, and preferences"
      ]}
    />
  );
}
