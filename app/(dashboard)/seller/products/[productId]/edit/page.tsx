import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { ProductEditor } from "@/components/platform/product-editor";
import { mongoIdOrSlug } from "@/lib/mongo-api";
import connectMongoDB from "@/lib/mongodb";
import Product from "@/models/Product";

export const metadata: Metadata = {
  title: "Edit Product"
};

function clean<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function normalizedOwner(value?: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

export default async function EditProductPage({
  params
}: {
  params: Promise<{ productId: string }>;
}) {
  const session = await auth();
  const { productId } = await params;

  await connectMongoDB();
  const product = await Product.findOne(mongoIdOrSlug(productId)).lean();
  if (!product) notFound();

  const isAdmin = session?.user?.role === "admin";
  const ownsById = product.sellerId && session?.user?.id && String(product.sellerId) === String(session.user.id);
  const ownsLegacy = normalizedOwner(product.sellerName) && [normalizedOwner(session?.user?.name), normalizedOwner(session?.user?.email)].includes(normalizedOwner(product.sellerName));
  if (!isAdmin && !ownsById && !ownsLegacy) notFound();

  return (
    <ProductEditor
      product={clean({
        id: String(product._id),
        name: product.name ?? "",
        slug: product.slug ?? productId,
        type: product.type ?? "Digital",
        description: product.description ?? "",
        sellerName: product.sellerName ?? session?.user?.name ?? "",
        price: Number(product.price ?? 0),
        compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : undefined,
        currency: product.currency ?? "USD",
        images: product.images ?? [],
        category: product.category ?? "",
        stock: Number(product.stock ?? 0),
        delivery: product.delivery ?? "",
        tools: product.tools ?? [],
        tags: product.tags ?? [],
        status: product.status ?? "draft"
      })}
    />
  );
}
