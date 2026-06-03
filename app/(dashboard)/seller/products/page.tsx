import type { Metadata } from "next";
import { auth } from "@/auth";
import { ProductManager } from "@/components/platform/creator-workbenches";
import connectMongoDB, { hasMongoConfig } from "@/lib/mongodb";
import { normalizeProduct } from "@/lib/platform-db";
import Product from "@/models/Product";

export const metadata: Metadata = {
  title: "Seller Products"
};

async function getSellerProducts() {
  const session = await auth();
  if (!session?.user || !hasMongoConfig()) return [];

  try {
    await connectMongoDB();
    const filter: Record<string, unknown>[] = [];
    if (session.user.id) filter.push({ sellerId: session.user.id });
    if (session.user.name) filter.push({ sellerName: new RegExp(`^${session.user.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") });

    if (!filter.length) return [];

    const products = await Product.find({ $or: filter, status: { $ne: "archived" } }).sort({ updatedAt: -1, createdAt: -1 }).limit(100).lean();

    return products.map(normalizeProduct);
  } catch {
    return [];
  }
}

export default async function SellerProductsPage() {
  const products = await getSellerProducts();

  return <ProductManager initialProducts={products} />;
}
