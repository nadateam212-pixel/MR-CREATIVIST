"use client";

import { useEffect, useState } from "react";
import { CreditCard, PackageCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { convertMoney, formatConvertedAmount, parseMoney } from "@/lib/currency";
import { publicPaymentErrorMessage } from "@/lib/payment-errors";
import { PaymentMethodSelector, type CheckoutPaymentDetails, type CheckoutPaymentMethod } from "@/components/platform/payment-method-selector";
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
  const [paymentMethod, setPaymentMethod] = useState<CheckoutPaymentMethod>("mtn_momo");
  const [paymentDetails, setPaymentDetails] = useState<CheckoutPaymentDetails>({
    mobilePhone: "",
    paypalEmail: "",
    cardNumber: "",
    cardName: "",
    cardExpiry: "",
    cardCvc: ""
  });
  const [walletBalanceFrw, setWalletBalanceFrw] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState("");
  const preferences = useUserPreferences();
  const { t } = useI18n();
  const parsedPrice = parseMoney(product.price);
  const unitPriceUsd = parsedPrice ? convertMoney(parsedPrice.amount, parsedPrice.currency, "USD", preferences.usdToFrw) : 0;
  const total = unitPriceUsd * quantity;
  const displayFrw = (amount: number) => formatConvertedAmount(amount, "FRW", "FRW", preferences.usdToFrw);

  useEffect(() => {
    let active = true;

    async function loadWallet() {
      try {
        const response = await fetch("/api/wallet", { cache: "no-store" });
        const payload = await response.json();
        if (active && response.ok) setWalletBalanceFrw(Number(payload.balance ?? 0));
      } catch {
        if (active) setWalletBalanceFrw(0);
      }
    }

    void loadWallet();
    return () => {
      active = false;
    };
  }, []);

  async function submitOrder(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (paymentMethod === "stripe") {
      setStatus("Stripe card payments are coming soon. Choose MTN MoMo, PayPal, or Wallet.");
      toast.error("Stripe card payments are coming soon.");
      return;
    }

    setSubmitting(true);
    setStatus("Processing payment...");

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buyerName: buyer.name,
          buyerEmail: buyer.email,
          paymentMethod,
          paymentDetails,
          items: [{ productId: product.id ?? product.slug, quantity }]
        })
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) throw new Error(payload.error ?? "Order failed.");

      if (payload.approvalUrl) {
        setStatus("Redirecting to PayPal...");
        globalThis.location.assign(payload.approvalUrl);
        return;
      }

      setStatus(payload.message ?? "Order saved. Check your email for fulfillment details.");
      toast.success(payload.message ?? "Order saved successfully.");
    } catch (error) {
      const nextMessage = publicPaymentErrorMessage(error, "Order failed.");
      setStatus(nextMessage);
      toast.error(nextMessage);
    } finally {
      setSubmitting(false);
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
            <PaymentMethodSelector
              value={paymentMethod}
              onChange={setPaymentMethod}
              details={paymentDetails}
              onDetailsChange={setPaymentDetails}
              walletBalance={displayFrw(walletBalanceFrw)}
            />
            <div className="flex justify-between border-t border-[hsl(var(--border))] pt-4 font-semibold">
              <span>{t("commerce.total")}</span>
              <span>{formatConvertedAmount(total, "USD", preferences.currency, preferences.usdToFrw)}</span>
            </div>
            {status ? <p className="text-sm font-medium text-[hsl(var(--primary))]">{status}</p> : null}
            <Button type="submit" disabled={submitting}>
              <CreditCard className="size-4" />
              {submitting ? "Processing..." : "Pay securely"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
