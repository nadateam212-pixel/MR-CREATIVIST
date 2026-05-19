import type { Metadata } from "next";
import { PublicFeaturePage } from "@/components/platform/public-feature-page";

export const metadata: Metadata = { title: "Course Preview" };

export default function CoursePreviewPage() {
  return (
    <PublicFeaturePage
      eyebrow="Free preview"
      title="Preview course lessons"
      description="Preview video, text, quiz, resource, and live-class lesson formats before enrollment."
      primaryHref="/courses"
      primaryLabel="Browse courses"
      highlights={[
        "Preview lesson player with progress-safe access",
        "Curriculum outline, attachments, captions, and instructor notes",
        "Enrollment CTA with coupon and wallet-ready checkout",
        "Course reviews, requirements, audience fit, and learning outcomes"
      ]}
      workflow={["Open course detail", "Watch free lessons", "Review curriculum", "Enroll through checkout"]}
    />
  );
}
