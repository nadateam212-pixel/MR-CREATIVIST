import type { Metadata } from "next";
import { PublicFeaturePage } from "@/components/platform/public-feature-page";

export const metadata: Metadata = { title: "Order Details" };

export default function MarketplaceOrderPage() {
  return (
    <PublicFeaturePage
      eyebrow="Order tracking"
      title="Order confirmation and tracking"
      description="A complete buyer receipt for payment state, downloads, shipment progress, support, and review prompts."
      primaryHref="/dashboard/orders"
      primaryLabel="My orders"
      highlights={[
        "Order number, items, totals, taxes, discounts, billing, and shipping addresses",
        "Payment status, refund state, and wallet transaction references",
        "Download links, download limits, tracking numbers, and shipping status",
        "Seller contact, dispute entry, return request, and review flow"
      ]}
    />
  );
}
