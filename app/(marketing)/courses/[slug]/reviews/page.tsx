import { PageShell } from "@/components/layout/page-shell";
import { RatingStars } from "@/components/ui/rating-stars";

export default function CourseReviewsPage() {
  return (
    <PageShell eyebrow="Reviews" title="Course reviews" description="Verified learner reviews, instructor replies, and rating distribution.">
      <RatingStars value={4.8} />
    </PageShell>
  );
}
