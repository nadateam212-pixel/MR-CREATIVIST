import type { Metadata } from "next";
import { PublicFeaturePage } from "@/components/platform/public-feature-page";

export const metadata: Metadata = { title: "Seller Store" };

export default function SellerStorePage() {
  return (
    <PublicFeaturePage
      eyebrow="Seller store"
      title="Seller storefront"
      description="A full seller store with products, categories, reviews, policies, shipping, and support entry points."
      primaryHref="/marketplace"
      primaryLabel="Shop products"
      highlights={[
        "Store branding, verification, policies, and seller profile",
        "Product grid with filters, featured products, bundles, and deals",
        "Customer reviews, seller replies, return requests, and dispute links",
        "Affiliate attribution, API-ready product feeds, and SEO metadata"
      ]}
    />
  );
}
