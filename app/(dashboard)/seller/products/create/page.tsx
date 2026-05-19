import type { Metadata } from "next";
import { auth } from "@/auth";
import { ProductBuilder } from "@/components/platform/creator-workbenches";

export const metadata: Metadata = {
  title: "Create Product"
};

export default async function CreateProductPage() {
  const session = await auth();

  return <ProductBuilder sellerName={session?.user?.name ?? "MR Creativist Seller"} />;
}
