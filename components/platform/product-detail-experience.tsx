"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Download, PackageCheck, ShieldCheck, Star, Store, Truck, Wallet } from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PriceDisplay } from "@/components/ui/price-display";
import { usePlatformStore } from "@/hooks/use-platform-store";

type ProductDetail = {
  id?: string;
  name: string;
  slug: string;
  type: string;
  category: string;
  price: string;
  compareAt?: string;
  seller: string;
  stock: number;
  rating: number;
  downloads: number;
  delivery: string;
  image: string;
  description?: string;
  tools: string[];
};

export function ProductDetailExperience({ slug, initialProduct }: { slug: string; initialProduct: ProductDetail | null }) {
  const router = useRouter();
  const createdProducts = usePlatformStore((state) => state.createdProducts);
  const addToCart = usePlatformStore((state) => state.addToCart);
  const [cartMessage, setCartMessage] = useState("");
  const product = initialProduct ?? createdProducts.find((item) => item.slug === slug && item.status === "published") ?? null;
  const productDescription = product && "description" in product ? product.description : undefined;

  if (!product) {
    return (
      <PageShell eyebrow="Product" title="Product not found" description="This product is not available yet.">
        <Card>
          <CardContent className="p-8 text-center">
            <PackageCheck className="mx-auto mb-3 size-8 text-[hsl(var(--primary))]" />
            <p className="text-[hsl(var(--muted-foreground))]">Create and publish a product to view it here.</p>
            <Button asChild className="mt-5">
              <Link href="/marketplace">Back to marketplace</Link>
            </Button>
          </CardContent>
        </Card>
      </PageShell>
    );
  }

  const activeProduct = product;

  function addProductToCart(openCheckout = false) {
    addToCart(activeProduct.slug);
    setCartMessage(`${activeProduct.name} added to cart.`);
    if (openCheckout) {
      router.push("/marketplace/cart");
    }
  }

  return (
    <PageShell
      eyebrow={activeProduct.category}
      title={activeProduct.name}
      description={productDescription ?? "Product gallery, inventory, seller profile, wallet checkout, delivery, and reviews."}
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_24rem]">
        <div className="space-y-6">
          <div className="overflow-hidden rounded-lg border border-[hsl(var(--border))]">
            <img src={activeProduct.image} alt={activeProduct.name} className="aspect-video w-full object-cover" />
          </div>

          <section className="grid gap-4 md:grid-cols-4">
            {[
              { label: "Rating", value: activeProduct.rating, icon: Star },
              { label: "Stock", value: activeProduct.stock, icon: PackageCheck },
              { label: "Delivery", value: activeProduct.delivery, icon: activeProduct.type === "Physical" ? Truck : Download },
              { label: "Seller", value: activeProduct.seller, icon: Store }
            ].map((metric) => (
              <Card key={metric.label}>
                <CardContent className="p-4">
                  <metric.icon className="mb-3 size-5 text-[hsl(var(--primary))]" />
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">{metric.label}</p>
                  <p className="mt-1 truncate font-semibold">{metric.value}</p>
                </CardContent>
              </Card>
            ))}
          </section>

          <Card>
            <CardHeader>
              <CardTitle>Included assets and seller tools</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              {activeProduct.tools.length > 0 ? (
                activeProduct.tools.map((tool) => (
                  <div key={tool} className="rounded-md border border-[hsl(var(--border))] p-4">
                    <ShieldCheck className="mb-3 size-5 text-[hsl(var(--primary))]" />
                    <p className="font-medium">{tool}</p>
                  </div>
                ))
              ) : (
                <div className="rounded-md border border-[hsl(var(--border))] p-4 text-sm text-[hsl(var(--muted-foreground))]">
                  Seller assets and delivery details will appear here soon.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-wrap gap-2">
                <Badge>{activeProduct.type}</Badge>
                <Badge>{activeProduct.delivery}</Badge>
              </div>
              <CardTitle className="pt-3">
                <PriceDisplay price={activeProduct.price} compareAt={activeProduct.compareAt} className="text-3xl text-[hsl(var(--primary))]" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full" onClick={() => addProductToCart(false)}>
                <Wallet className="size-4" />
                Add to cart
              </Button>
              <Button className="w-full" variant="outline" onClick={() => addProductToCart(true)}>
                <PackageCheck className="size-4" />
                Add and view cart
              </Button>
              {cartMessage ? (
                <p className="rounded-md border border-[hsl(var(--primary))]/25 bg-[hsl(var(--primary))]/10 p-3 text-sm font-medium text-[hsl(var(--primary))]">
                  {cartMessage}
                </p>
              ) : null}
              <p className="text-sm leading-6 text-[hsl(var(--muted-foreground))]">
                Supports wallet, card, PayPal, mobile money, coupons, invoices, refunds, and seller payout attribution.
              </p>
            </CardContent>
          </Card>
        </aside>
      </div>
    </PageShell>
  );
}
