import type { Metadata } from "next";
import { PublicFeaturePage } from "@/components/platform/public-feature-page";

export const metadata: Metadata = { title: "Help Article" };

export default function HelpArticlePage() {
  return (
    <PublicFeaturePage
      eyebrow="Help article"
      title="Support article"
      description="Step-by-step help content with related articles, support escalation, and feedback tracking."
      primaryHref="/help-center"
      primaryLabel="Help center"
      highlights={[
        "Article body, category, tags, updated date, and author metadata",
        "Related articles, support escalation, and ticket attachment guidance",
        "Helpful voting, view tracking, and admin article management",
        "Role-specific troubleshooting for learning, commerce, consulting, and wallet flows"
      ]}
    />
  );
}
