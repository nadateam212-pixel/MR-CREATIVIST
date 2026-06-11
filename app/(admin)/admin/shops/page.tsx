import type { Metadata } from "next";
import { AdminContentTable, type AdminContentRow } from "@/components/admin/admin-content-table";
import connectMongoDB from "@/lib/mongodb";
import { normalizeShopProfile } from "@/lib/platform-db";
import ShopProfile from "@/models/ShopProfile";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Businesses Admin"
};

function clean<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

export default async function AdminShopsPage() {
  await connectMongoDB();

  const shops = clean(
    (await ShopProfile.find({}).sort({ isFeatured: -1, rating: -1, updatedAt: -1 }).limit(120).lean()).map(normalizeShopProfile)
  );

  const rows: AdminContentRow[] = shops.map((shop: ReturnType<typeof normalizeShopProfile>) => ({
    id: String(shop.id ?? shop.slug),
    title: shop.name,
    subtitle: `${shop.category ?? "Business"} - ${[shop.city, shop.country].filter(Boolean).join(", ") || "Location not set"}`,
    image: shop.coverImage ?? shop.logo,
    kind: "business",
    status: shop.status ?? "draft",
    isVerified: Boolean(shop.isVerified),
    href: shop.slug ? `/business-directory#${shop.slug}` : "/business-directory",
    apiPath: `/api/shops/${shop.id ?? shop.slug}`,
    updateMethod: "PATCH",
    statusActions: [
      { label: "Approve", status: "approved" },
      { label: "Publish", status: "published" },
      { label: "Request changes", status: "changes_requested" },
      { label: "Verify badge", patch: { isVerified: true } }
    ],
    editFields: [
      { key: "name", label: "Business name", value: shop.name },
      { key: "category", label: "Category", value: shop.category ?? "" },
      {
        key: "status",
        label: "Status",
        value: shop.status ?? "draft",
        options: ["draft", "submitted", "changes_requested", "approved", "published", "archived"]
      }
    ]
  }));

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <div>
        <p className="text-sm font-black uppercase tracking-[0.18em] text-[hsl(var(--primary))]">Business moderation</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Businesses</h1>
      </div>
      <AdminContentTable title="Business records" rows={rows} emptyMessage="No businesses have been created yet." />
    </div>
  );
}
