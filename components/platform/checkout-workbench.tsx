"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, CreditCard, Download, Minus, PackageCheck, Plus, ShieldCheck, ShoppingCart, Tag, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PriceDisplay } from "@/components/ui/price-display";
import { convertMoney, formatConvertedAmount, parseMoney } from "@/lib/currency";
import { useI18n } from "@/hooks/use-i18n";
import { usePlatformStore } from "@/hooks/use-platform-store";
import { useUserPreferences } from "@/hooks/use-user-preferences";

type CheckoutProduct = {
  id?: string;
  slug: string;
  name: string;
  type: string;
  delivery: string;
  seller: string;
  price: string;
};

export function CheckoutWorkbench({ mode = "cart", products = [] }: { mode?: "cart" | "checkout"; products?: CheckoutProduct[] }) {
  const [coupon, setCoupon] = useState("CREATOR15");
  const [paymentMethod, setPaymentMethod] = useState("Wallet");
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderStatus, setOrderStatus] = useState("");
  const preferences = useUserPreferences();
  const { t } = useI18n();
  const cartItems = usePlatformStore((state) => state.cartItems);
  const addToCart = usePlatformStore((state) => state.addToCart);
  const updateCartQuantity = usePlatformStore((state) => state.updateCartQuantity);
  const clearCart = usePlatformStore((state) => state.clearCart);
  const purchase = usePlatformStore((state) => state.purchase);
  const walletBalance = usePlatformStore((state) => state.walletBalance);
  const createdProducts = usePlatformStore((state) => state.createdProducts);
  const marketplaceProducts = useMemo(
    () => [...products, ...createdProducts.filter((product) => product.status === "published")],
    [products, createdProducts]
  );

  const cartProducts = marketplaceProducts
    .filter((product) => cartItems[product.slug])
    .map((product) => {
      const parsed = parseMoney(product.price);
      const unitPrice = parsed ? convertMoney(parsed.amount, parsed.currency, "USD", preferences.usdToFrw) : 0;

      return {
        ...product,
        quantity: cartItems[product.slug] ?? 0,
        subtotal: unitPrice * (cartItems[product.slug] ?? 0)
      };
    });

  const subtotal = cartProducts.reduce((total, product) => total + product.subtotal, 0);
  const discount = coupon.trim().toUpperCase() === "CREATOR15" ? subtotal * 0.15 : 0;
  const tax = (subtotal - discount) * 0.04;
  const total = Math.max(0, subtotal - discount + tax);
  const suggestedProducts = useMemo(() => marketplaceProducts.slice(0, 3), [marketplaceProducts]);
  const displayMoney = (amount: number) => formatConvertedAmount(amount, "USD", preferences.currency, preferences.usdToFrw);

  async function completeOrder() {
    setOrderStatus("Saving order...");

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buyerName: "Guest buyer",
          buyerEmail: "buyer@example.com",
          paymentMethod,
          discount,
          tax,
          items: cartProducts.map((product) => ({
            productId: "id" in product && product.id ? product.id : product.slug,
            quantity: product.quantity
          }))
        })
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error ?? "Order could not be saved.");
      }

      setOrderStatus("Order saved.");
    } catch (error) {
      setOrderStatus(error instanceof Error ? error.message : "Order completed on this device. Please try again if it does not appear in your orders.");
    }

    purchase(total, `Marketplace checkout by ${paymentMethod}`);
    clearCart();
    setOrderComplete(true);
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 lg:grid-cols-[1fr_24rem]">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <ShoppingCart className="size-5 text-[hsl(var(--primary))]" />
              <CardTitle>{mode === "checkout" ? "Checkout" : "Shopping cart"}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {orderComplete ? (
              <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/35 p-5">
                <p className="flex items-center gap-2 text-lg font-semibold text-[hsl(var(--primary))]">
                  <CheckCircle2 className="size-5" />
                  Order completed
                </p>
                <p className="mt-2 text-sm leading-6 text-[hsl(var(--muted-foreground))]">
                  Downloads, invoices, seller notifications, wallet transaction, and order tracking are ready in the local workflow.
                </p>
                {orderStatus ? <p className="mt-3 text-sm font-medium">{orderStatus}</p> : null}
              </div>
            ) : cartProducts.length > 0 ? (
              cartProducts.map((product) => (
                <div key={product.slug} className="grid gap-4 rounded-lg border border-[hsl(var(--border))] p-4 md:grid-cols-[1fr_auto] md:items-center">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <Badge>{product.type}</Badge>
                      <Badge>{product.delivery}</Badge>
                    </div>
                    <h2 className="mt-3 text-lg font-semibold">{product.name}</h2>
                    <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">Sold by {product.seller}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <Button size="icon" variant="outline" onClick={() => updateCartQuantity(product.slug, product.quantity - 1)}>
                      <Minus className="size-4" />
                    </Button>
                    <span className="w-8 text-center font-semibold">{product.quantity}</span>
                    <Button size="icon" variant="outline" onClick={() => updateCartQuantity(product.slug, product.quantity + 1)}>
                      <Plus className="size-4" />
                    </Button>
                    <p className="w-24 text-right font-semibold">{displayMoney(product.subtotal)}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="grid gap-4 md:grid-cols-3">
                {suggestedProducts.map((product) => (
                  <div key={product.slug} className="rounded-lg border border-[hsl(var(--border))] p-4">
                    <Badge>{product.type}</Badge>
                    <h3 className="mt-3 font-semibold">{product.name}</h3>
                    <PriceDisplay price={product.price} className="mt-2 text-sm font-medium text-[hsl(var(--muted-foreground))]" />
                    <Button className="mt-4 w-full" size="sm" onClick={() => addToCart(product.slug)}>
                      <ShoppingCart className="size-4" />
                      Add
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Order summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-[hsl(var(--muted-foreground))]">{t("commerce.subtotal")}</span>
                <span>{displayMoney(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[hsl(var(--muted-foreground))]">{t("commerce.discount")}</span>
                <span>{displayMoney(discount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[hsl(var(--muted-foreground))]">{t("commerce.tax")}</span>
                <span>{displayMoney(tax)}</span>
              </div>
              <div className="border-t border-[hsl(var(--border))] pt-3 text-base font-semibold">
                <div className="flex justify-between">
                  <span>{t("commerce.total")}</span>
                  <span>{displayMoney(total)}</span>
                </div>
              </div>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium" htmlFor="coupon">
                Coupon
              </label>
              <div className="flex gap-2">
                <Input id="coupon" value={coupon} onChange={(event) => setCoupon(event.target.value)} />
                <Button variant="outline" size="icon">
                  <Tag className="size-4" />
                </Button>
              </div>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium" htmlFor="payment">
                Payment method
              </label>
              <select
                id="payment"
                value={paymentMethod}
                onChange={(event) => setPaymentMethod(event.target.value)}
                className="h-10 rounded-md border border-[hsl(var(--border))] bg-transparent px-3 text-sm"
              >
                {["Wallet", "Stripe card", "PayPal", "Mobile money", "Bank transfer"].map((method) => (
                  <option key={method}>{method}</option>
                ))}
              </select>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">
                {t("commerce.walletBalance")}: {displayMoney(walletBalance)}
              </p>
            </div>

            {mode === "checkout" ? (
              <Button className="w-full" disabled={total <= 0 || cartProducts.length === 0} onClick={completeOrder}>
                <CreditCard className="size-4" />
                Pay securely
              </Button>
            ) : (
              <Button asChild className="w-full" disabled={cartProducts.length === 0}>
                <Link href="/marketplace/checkout">
                  <ShieldCheck className="size-4" />
                  Proceed to checkout
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          { label: "Digital delivery", body: "Download limits, license keys, invoice files, and buyer notifications.", icon: Download },
          { label: "Fulfillment", body: "Shipping rules, tracking numbers, returns, disputes, and seller messaging.", icon: PackageCheck },
          { label: "Wallet accounting", body: "Purchases, deposits, transfers, refunds, commissions, and payout records.", icon: Wallet }
        ].map((item) => (
          <Card key={item.label}>
            <CardContent className="p-5">
              <item.icon className="mb-4 size-5 text-[hsl(var(--primary))]" />
              <h3 className="font-semibold">{item.label}</h3>
              <p className="mt-2 text-sm leading-6 text-[hsl(var(--muted-foreground))]">{item.body}</p>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
