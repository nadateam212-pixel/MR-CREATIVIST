"use client";

import { useState } from "react";
import { CreditCard, PackageCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { convertMoney, formatConvertedAmount, parseMoney } from "@/lib/currency";
import { useI18n } from "@/hooks/use-i18n";
import { useUserPreferences } from "@/hooks/use-user-preferences";

type BuyProduct = {
  id?: string;
  name: string;
  slug: string;
  type: string;
  seller: string;
  price: string;
  delivery: string;
};

export function ProductBuyPanel({ product }: { product: BuyProduct }) {
  const [quantity, setQuantity] = useState(1);
  const [buyer, setBuyer] = useState({ name: "", email: "" });
  const [paymentMethod, setPaymentMethod] = useState("Wallet");
  const [status, setStatus] = useState("");
  const preferences = useUserPreferences();
  const { t } = useI18n();
  const parsedPrice = parseMoney(product.price);
  const unitPriceUsd = parsedPrice ? convertMoney(parsedPrice.amount, parsedPrice.currency, "USD", preferences.usdToFrw) : 0;
  const total = unitPriceUsd * quantity;

  async function submitOrder(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("Saving order...");

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buyerName: buyer.name,
          buyerEmail: buyer.email,
          paymentMethod,
          items: [{ productId: product.id ?? product.slug, quantity }]
        })
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) throw new Error(payload.error ?? "Order failed.");

      setStatus("Order saved. Check your email for fulfillment details.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Order failed.");
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_24rem]">
      <Card>
        <CardHeader>
          <CardTitle>{product.name}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 text-sm text-[hsl(var(--muted-foreground))]">
          <p>Sold by {product.seller}</p>
          <p className="flex items-center gap-2">
            <PackageCheck className="size-4 text-[hsl(var(--primary))]" />
            {product.type} - {product.delivery}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Complete purchase</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4" onSubmit={submitOrder}>
            <Input required placeholder="Full name" value={buyer.name} onChange={(event) => setBuyer((current) => ({ ...current, name: event.target.value }))} />
            <Input required type="email" placeholder="Email address" value={buyer.email} onChange={(event) => setBuyer((current) => ({ ...current, email: event.target.value }))} />
            <Input min={1} type="number" value={quantity} onChange={(event) => setQuantity(Math.max(1, Number(event.target.value)))} />
            <select
              value={paymentMethod}
              onChange={(event) => setPaymentMethod(event.target.value)}
              className="h-10 rounded-md border border-[hsl(var(--border))] bg-transparent px-3 text-sm"
            >
              {["Wallet", "Stripe card", "PayPal", "Mobile money", "Bank transfer"].map((method) => (
                <option key={method}>{method}</option>
              ))}
            </select>
            <div className="flex justify-between border-t border-[hsl(var(--border))] pt-4 font-semibold">
              <span>{t("commerce.total")}</span>
              <span>{formatConvertedAmount(total, "USD", preferences.currency, preferences.usdToFrw)}</span>
            </div>
            {status ? <p className="text-sm font-medium text-[hsl(var(--primary))]">{status}</p> : null}
            <Button type="submit">
              <CreditCard className="size-4" />
              Pay securely
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
