import type { Metadata } from "next";
import { PublicFeaturePage } from "@/components/platform/public-feature-page";

export const metadata: Metadata = { title: "Instructors" };

export default function InstructorsPage() {
  return (
    <PublicFeaturePage
      eyebrow="Top instructors"
      title="Find expert instructors"
      description="Explore instructors by expertise, rating, course count, student outcomes, and verified credentials."
      primaryHref="/courses"
      primaryLabel="Browse courses"
      highlights={[
        "Instructor profile cards with ratings, students, courses, and specialties",
        "Verified instructor badges, portfolio links, and social proof",
        "Course bundles, newest courses, and student review summaries",
        "Messaging, follow, and recommendation-ready discovery"
      ]}
    />
  );
}
