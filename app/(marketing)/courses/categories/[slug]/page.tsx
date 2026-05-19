import type { Metadata } from "next";
import { PublicFeaturePage } from "@/components/platform/public-feature-page";

export const metadata: Metadata = { title: "Course Category" };

export default function CourseCategoryPage() {
  return (
    <PublicFeaturePage
      eyebrow="Course category"
      title="Category-filtered courses"
      description="Browse published courses by topic, level, price, rating, language, duration, and instructor."
      primaryHref="/courses"
      primaryLabel="All courses"
      highlights={[
        "Category landing page with SEO metadata",
        "Search, filters, sorting, and pagination-ready layout",
        "Featured courses, popular instructors, and recommended paths",
        "Course cards with ratings, level, price, and preview links"
      ]}
    />
  );
}
