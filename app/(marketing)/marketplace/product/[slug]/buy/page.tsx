import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/layout/page-shell";
import { ProductBuyPanel } from "@/components/platform/product-buy-panel";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getProductBySlug } from "@/lib/platform-db";

export const metadata: Metadata = { title: "Buy Product" };

export default async function ProductBuyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  return (
    <PageShell
      eyebrow="Product checkout"
      title={product ? `Buy ${product.name}` : "Buy product"}
      description="Product-specific checkout for digital downloads, physical goods, service products, and marketplace bundles."
    >
      {product ? (
        <ProductBuyPanel product={product} />
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-[hsl(var(--muted-foreground))]">This product is not available yet.</p>
            <Button asChild className="mt-5">
              <Link href="/marketplace">Back to marketplace</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </PageShell>
  );
}
