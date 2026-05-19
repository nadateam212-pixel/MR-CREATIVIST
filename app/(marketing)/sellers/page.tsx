import type { Metadata } from "next";
import { PublicFeaturePage } from "@/components/platform/public-feature-page";

export const metadata: Metadata = { title: "Sellers" };

export default function SellersPage() {
  return (
    <PublicFeaturePage
      eyebrow="Top sellers"
      title="Discover marketplace sellers"
      description="Browse verified sellers, store categories, ratings, return policies, featured products, and customer trust signals."
      primaryHref="/marketplace"
      primaryLabel="Browse marketplace"
      highlights={[
        "Seller cards with revenue signals, product count, ratings, and verification",
        "Store policies, shipping coverage, and digital delivery badges",
        "Featured sellers, new sellers, category specialists, and hot stores",
        "Customer messaging and seller review summaries"
      ]}
    />
  );
}
