import { ProductDetailExperience } from "@/components/platform/product-detail-experience";
import { getProductBySlug } from "@/lib/platform-db";

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  return <ProductDetailExperience slug={slug} initialProduct={product} />;
}
