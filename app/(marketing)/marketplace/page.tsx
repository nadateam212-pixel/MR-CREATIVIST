import type { Metadata } from "next";
import { CatalogExperience } from "@/components/platform/catalog-experience";
import { getProducts } from "@/lib/platform-db";

export const metadata: Metadata = {
  title: "Marketplace"
};

export default async function MarketplacePage() {
  const products = await getProducts();

  return <CatalogExperience mode="marketplace" products={products} />;
}
