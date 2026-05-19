import type { Metadata } from "next";
import { auth } from "@/auth";
import { ShopBuilder } from "@/components/platform/job-shop-workbenches";
import { getShopProfiles } from "@/lib/platform-db";

export const metadata: Metadata = {
  title: "Seller Business Listing"
};

export default async function SellerShopPage() {
  const session = await auth();
  const initialShops = session?.user?.id
    ? await getShopProfiles({ ownerId: session.user.id, all: true, limit: 24 })
    : [];

  return <ShopBuilder initialShops={initialShops} sellerName={session?.user?.name ?? "MR Creativist Seller"} />;
}
