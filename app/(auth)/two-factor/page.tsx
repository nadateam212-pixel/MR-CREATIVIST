import type { Metadata } from "next";
import { PublicFeaturePage } from "@/components/platform/public-feature-page";

export const metadata: Metadata = { title: "Two-Factor Authentication" };

export default function TwoFactorPage() {
  return (
    <PublicFeaturePage
      eyebrow="Security"
      title="Two-factor authentication"
      description="Protect sign-in and sensitive financial actions with one-time codes and recovery controls."
      primaryHref="/dashboard"
      primaryLabel="Open dashboard"
      highlights={[
        "One-time code verification for login and withdrawal actions",
        "Recovery codes, trusted devices, and session monitoring",
        "Security notifications and account activity history",
        "Admin visibility for suspicious login and payout attempts"
      ]}
    />
  );
}
