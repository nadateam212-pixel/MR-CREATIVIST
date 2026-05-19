import type { Metadata } from "next";
import { PublicFeaturePage } from "@/components/platform/public-feature-page";

export const metadata: Metadata = { title: "Help Center" };

export default function HelpCenterPage() {
  return (
    <PublicFeaturePage
      eyebrow="Support"
      title="Help center"
      description="A searchable support hub for platform workflows, billing, technical issues, creator operations, and account security."
      primaryHref="/contact"
      primaryLabel="Open ticket"
      highlights={[
        "Knowledge base categories for learners, instructors, sellers, consultants, and affiliates",
        "Ticket creation, priority, attachments, staff replies, and resolution tracking",
        "FAQ management, chat support settings, and admin moderation",
        "Helpful article voting, related resources, and email notification hooks"
      ]}
    />
  );
}
