import type { Metadata } from "next";
import { PageShell } from "@/components/layout/page-shell";
import { CheckoutWorkbench } from "@/components/platform/checkout-workbench";
import { getProducts } from "@/lib/platform-db";

export const metadata: Metadata = {
  title: "Checkout"
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function CheckoutPage() {
  const products = await getProducts({ includeImages: false, limit: 80 });

  return (
    <PageShell eyebrow="Payments" title="Checkout" description="Complete wallet, card, PayPal, mobile money, coupon, tax, and order creation flow.">
      <CheckoutWorkbench mode="checkout" products={products} />
    </PageShell>
  );
}
