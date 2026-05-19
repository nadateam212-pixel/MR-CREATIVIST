import type { Metadata } from "next";
import { PublicFeaturePage } from "@/components/platform/public-feature-page";

export const metadata: Metadata = { title: "Blog Category" };

export default function BlogCategoryPage() {
  return (
    <PublicFeaturePage
      eyebrow="Editorial category"
      title="Blog category"
      description="Browse published articles by category with search, tags, author filters, comments, and sharing."
      primaryHref="/blog"
      primaryLabel="All posts"
      highlights={[
        "Category archive with SEO title, description, and canonical structure",
        "Author, tag, date, popularity, and search filters",
        "Comment moderation, likes, related posts, and newsletter capture",
        "Editorial analytics for views, likes, and acquisition"
      ]}
    />
  );
}
