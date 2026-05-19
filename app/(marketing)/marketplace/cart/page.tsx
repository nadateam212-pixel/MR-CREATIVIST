import type { Metadata } from "next";
import { PageShell } from "@/components/layout/page-shell";
import { CheckoutWorkbench } from "@/components/platform/checkout-workbench";
import { getProducts } from "@/lib/platform-db";

export const metadata: Metadata = {
  title: "Shopping Cart"
};

export default async function CartPage() {
  const products = await getProducts();

  return (
    <PageShell eyebrow="Cart" title="Shopping cart" description="Manage quantities, coupons, delivery rules, wallet payment, and checkout readiness.">
      <CheckoutWorkbench mode="cart" products={products} />
    </PageShell>
  );
}
