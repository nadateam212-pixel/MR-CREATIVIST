"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { MapPin, MessageCircle, MessageSquare, PackageCheck, ShieldCheck, Star, Store, Wallet } from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/components/layout/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PriceDisplay } from "@/components/ui/price-display";
import { VerifiedMark } from "@/components/ui/verified-mark";
import { usePlatformStore } from "@/hooks/use-platform-store";

type ProductDetail = {
  id?: string;
  sellerId?: string;
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
  images?: string[];
  location?: string;
  description?: string;
  tools: string[];
  isVerified?: boolean;
  sellerVerified?: boolean;
  sellerPhone?: string;
  sellerEmail?: string;
};

export function ProductDetailExperience({ initialProduct }: { initialProduct: ProductDetail | null }) {
  const router = useRouter();
  const addToCart = usePlatformStore((state) => state.addToCart);
  const [cartMessage, setCartMessage] = useState("");
  const [selectedImage, setSelectedImage] = useState(initialProduct?.image ?? "");
  const product = initialProduct;
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

  const activeProduct = product as ProductDetail;
  const verifiedCheckout = Boolean(activeProduct.isVerified || activeProduct.sellerVerified);
  const whatsappText = encodeURIComponent(`Hello ${activeProduct.seller}, I am interested in ${activeProduct.name} on MR Creativist.`);
  const whatsappPhone = activeProduct.sellerPhone?.replace(/[^\d+]/g, "").replace(/^\+/, "");
  const whatsappHref = whatsappPhone ? `https://wa.me/${whatsappPhone}?text=${whatsappText}` : `https://wa.me/?text=${whatsappText}`;
  const sellerMessageHref = activeProduct.sellerId
    ? `/messages/${activeProduct.sellerId}`
    : `/messages?context=product&product=${encodeURIComponent(activeProduct.slug)}`;

  function addProductToCart(openCheckout = false) {
    if (!verifiedCheckout) {
      const nextMessage = "This seller is not verified for online checkout yet. Contact the seller directly.";
      setCartMessage(nextMessage);
      toast.message(nextMessage);
      return;
    }

    addToCart(activeProduct.slug);
    setCartMessage(`${activeProduct.name} added to cart.`);
    toast.success(`${activeProduct.name} added to cart.`);
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
          <div className="grid gap-3 md:grid-cols-[6rem_1fr]">
            <div className="order-2 flex gap-2 overflow-x-auto md:order-1 md:flex-col">
              {(activeProduct.images?.length ? activeProduct.images : [activeProduct.image]).map((image) => <button key={image} type="button" onClick={() => setSelectedImage(image)} className={selectedImage === image ? "relative aspect-square w-20 shrink-0 overflow-hidden rounded-md border-2 border-[hsl(var(--primary))] md:w-full" : "relative aspect-square w-20 shrink-0 overflow-hidden rounded-md border border-[hsl(var(--border))] md:w-full"}><img src={image} alt="" className="size-full object-cover" /></button>)}
            </div>
            <div className="order-1 overflow-hidden rounded-md border border-[hsl(var(--border))] md:order-2">
              <img src={selectedImage || activeProduct.image} alt={activeProduct.name} className="aspect-[4/3] w-full object-cover" />
            </div>
          </div>

          <section className="grid gap-4 md:grid-cols-4">
            {[
              { label: "Rating", value: activeProduct.rating, icon: Star },
              { label: "Stock", value: activeProduct.stock, icon: PackageCheck },
              { label: "Location", value: activeProduct.location || "Kigali, Rwanda", icon: MapPin },
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
            <CardHeader><CardTitle>Product description</CardTitle></CardHeader>
            <CardContent><p className="whitespace-pre-line text-sm leading-7 text-[hsl(var(--muted-foreground))]">{productDescription}</p></CardContent>
          </Card>

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
                <Badge>{verifiedCheckout ? "Online checkout" : "Contact seller"}</Badge>
              </div>
              <CardTitle className="pt-3">
                <PriceDisplay price={activeProduct.price} compareAt={activeProduct.compareAt} targetCurrency="FRW" className="text-3xl text-[hsl(var(--primary))]" />
              </CardTitle>
              <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-[hsl(var(--muted-foreground))]">
                Sold by {activeProduct.seller}
                {verifiedCheckout ? <VerifiedMark label="Verified seller" /> : null}
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              {verifiedCheckout ? (
                <>
                  <Button className="w-full" onClick={() => addProductToCart(false)}>
                    <Wallet className="size-4" />
                    Add to cart
                  </Button>
                  <Button className="w-full" variant="outline" onClick={() => addProductToCart(true)}>
                    <PackageCheck className="size-4" />
                    Add and view cart
                  </Button>
                </>
              ) : (
                <div className="grid gap-2">
                  <Button asChild className="w-full">
                    <Link href={sellerMessageHref}>
                      <MessageSquare className="size-4" />
                      Message seller
                    </Link>
                  </Button>
                  <Button asChild className="w-full" variant="outline">
                    <a href={whatsappHref} target="_blank" rel="noreferrer">
                      <MessageCircle className="size-4" />
                      Contact on WhatsApp
                    </a>
                  </Button>
                </div>
              )}
              {cartMessage ? (
                <p className="rounded-md border border-[hsl(var(--primary))]/25 bg-[hsl(var(--primary))]/10 p-3 text-sm font-medium text-[hsl(var(--primary))]">
                  {cartMessage}
                </p>
              ) : null}
              <p className="text-sm leading-6 text-[hsl(var(--muted-foreground))]">
                {verifiedCheckout
                  ? "Supports wallet, card, PayPal, mobile money, coupons, invoices, refunds, and seller payout attribution."
                  : "Online checkout opens after the seller account is verified. Use message or WhatsApp to agree on delivery directly."}
              </p>
            </CardContent>
          </Card>
        </aside>
      </div>
    </PageShell>
  );
}
