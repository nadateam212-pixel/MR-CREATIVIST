import type { Metadata } from "next";
import { PublicFeaturePage } from "@/components/platform/public-feature-page";

export const metadata: Metadata = { title: "Instructor Profile" };

export default function InstructorProfilePage() {
  return (
    <PublicFeaturePage
      eyebrow="Instructor profile"
      title="Instructor profile"
      description="A complete instructor storefront with biography, courses, reviews, certificates, announcements, and stats."
      primaryHref="/courses"
      primaryLabel="View courses"
      highlights={[
        "Instructor bio, expertise, credentials, total students, and average rating",
        "Published courses, bundles, featured lessons, and coupons",
        "Student reviews, Q&A visibility, and announcement archive",
        "Contact, follow, affiliate attribution, and SEO metadata"
      ]}
    />
  );
}
