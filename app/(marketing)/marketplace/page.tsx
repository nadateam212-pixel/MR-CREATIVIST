import type { Metadata } from "next";
import { CatalogExperience } from "@/components/platform/catalog-experience";
import { getProducts } from "@/lib/platform-db";

export const metadata: Metadata = {
  title: "Marketplace"
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function MarketplacePage() {
  const products = await getProducts({ limit: 40 });

  return <CatalogExperience mode="marketplace" products={products} />;
}
