import type { Metadata } from "next";
import { ProductManager } from "@/components/platform/creator-workbenches";
import { getProducts } from "@/lib/platform-db";

export const metadata: Metadata = {
  title: "Seller Products"
};

export default async function SellerProductsPage() {
  const products = await getProducts();

  return <ProductManager initialProducts={products} />;
}
