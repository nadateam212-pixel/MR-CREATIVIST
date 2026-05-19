import type { Metadata } from "next";
import { PublicFeaturePage } from "@/components/platform/public-feature-page";

export const metadata: Metadata = { title: "Search" };

export default function SearchPage() {
  return (
    <PublicFeaturePage
      eyebrow="Global search"
      title="Search courses, products, consultants, posts, and help"
      description="Unified search across learning, marketplace, consulting, editorial, support, and profile content."
      primaryHref="/courses"
      primaryLabel="Courses"
      secondaryHref="/marketplace"
      secondaryLabel="Marketplace"
      highlights={[
        "Search results grouped by content type with filters and sorting",
        "Course, product, consultant, blog, instructor, seller, and help-center indexes",
        "Smart search plus AI recommendation hooks",
        "Click analytics, recent searches, saved results, and empty-state recommendations"
      ]}
    />
  );
}
