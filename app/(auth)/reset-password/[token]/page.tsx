import type { Metadata } from "next";
import { PublicFeaturePage } from "@/components/platform/public-feature-page";

export const metadata: Metadata = { title: "Reset Password" };

export default function ResetPasswordPage() {
  return (
    <PublicFeaturePage
      eyebrow="Account recovery"
      title="Set a new password"
      description="Validate a reset token, collect a new password, revoke old device sessions, and notify the user."
      primaryHref="/login"
      primaryLabel="Login"
      highlights={[
        "Token validation, expiry handling, and single-use reset flow",
        "Password strength validation and secure bcrypt hashing",
        "Device session revocation and security notification",
        "Audit log entry and support fallback"
      ]}
    />
  );
}
