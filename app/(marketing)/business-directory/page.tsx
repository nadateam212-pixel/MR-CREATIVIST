import type { Metadata } from "next";
import Link from "next/link";
import { ShopDirectory, type PublicShopProfile } from "@/components/platform/job-shop-workbenches";
import { Button } from "@/components/ui/button";
import { getShopProfiles } from "@/lib/platform-db";

export const metadata: Metadata = {
  title: "Business Directory",
  description:
    "Discover MR Creativist businesses in Rwanda, Africa, Canada and globally for AI, multimedia, marketplace, digital products, consulting and creative services."
};

export default async function BusinessDirectoryPage() {
  const businesses = await getShopProfiles({ limit: 120 });
  const records = [...(businesses as PublicShopProfile[])].sort((left, right) => {
    const leftScore = (left.isFeatured ? 100 : 0) + Number(left.rating ?? 0);
    const rightScore = (right.isFeatured ? 100 : 0) + Number(right.rating ?? 0);
    return rightScore - leftScore;
  });

  return (
    <div className="border-y border-[hsl(var(--border))] bg-[hsl(var(--muted))]/35">
      <section className="app-frame py-6">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[hsl(var(--primary))]">Businesses</p>
            <h1 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">Listed businesses</h1>
          </div>
          <Button asChild>
            <Link href="/seller/shop">List your business</Link>
          </Button>
        </div>
        <ShopDirectory shops={records} showHeader={false} />
      </section>
    </div>
  );
}
