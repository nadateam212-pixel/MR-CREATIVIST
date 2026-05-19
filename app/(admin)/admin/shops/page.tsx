import type { Metadata } from "next";
import { ShopBuilder } from "@/components/platform/job-shop-workbenches";
import { getShopProfiles } from "@/lib/platform-db";

export const metadata: Metadata = {
  title: "Businesses Admin"
};

export default async function AdminShopsPage() {
  const shops = await getShopProfiles({ limit: 24 });

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8">
      <div>
        <p className="text-sm font-black uppercase tracking-[0.18em] text-[hsl(var(--primary))]">Business module</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">Manage public businesses</h1>
        <p className="mt-4 max-w-3xl text-[hsl(var(--muted-foreground))]">
          Publish seller businesses with logos, contacts, addresses, products, services and public messaging links.
        </p>
      </div>
      <ShopBuilder initialShops={shops} sellerName="MR Creativist Admin" />
    </div>
  );
}
