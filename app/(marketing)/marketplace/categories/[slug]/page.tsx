import type { Metadata } from "next";
import { PublicFeaturePage } from "@/components/platform/public-feature-page";

export const metadata: Metadata = { title: "Product Category" };

export default function ProductCategoryPage() {
  return (
    <PublicFeaturePage
      eyebrow="Marketplace category"
      title="Category-filtered products"
      description="Discover digital, physical, service, course, and consulting products with category-specific filters."
      primaryHref="/marketplace"
      primaryLabel="All products"
      highlights={[
        "Grid and list browsing modes with price, rating, seller, and stock filters",
        "Featured products, hot deals, bundles, and related categories",
        "Wishlist, cart add, quick buy, and product comparison actions",
        "SEO metadata and category hierarchy support"
      ]}
    />
  );
}
