import type { Metadata } from "next";
import { PublicFeaturePage } from "@/components/platform/public-feature-page";

export const metadata: Metadata = { title: "Verify Email" };

export default function VerifyEmailPage() {
  return (
    <PublicFeaturePage
      eyebrow="Email verification"
      title="Verify your email"
      description="Confirm account ownership, activate wallet features, and unlock role-specific onboarding."
      primaryHref="/login"
      primaryLabel="Continue to login"
      highlights={[
        "Verification token validation and account activation",
        "Welcome email, notification center entry, and activity log",
        "Role onboarding for learners, instructors, sellers, consultants, and affiliates",
        "Resend verification support for expired tokens"
      ]}
    />
  );
}
