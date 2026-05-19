import type { Metadata } from "next";
import { PublicFeaturePage } from "@/components/platform/public-feature-page";

export const metadata: Metadata = { title: "Forgot Password" };

export default function ForgotPasswordPage() {
  return (
    <PublicFeaturePage
      eyebrow="Account recovery"
      title="Reset your password"
      description="Request a secure password reset link with rate limiting, email notification, and audit logging."
      primaryHref="/login"
      primaryLabel="Back to login"
      highlights={[
        "Email-based reset request with token expiry",
        "Rate limiting and activity logging",
        "Resend-ready notification template",
        "Security guidance and support escalation"
      ]}
    />
  );
}
