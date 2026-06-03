import type { Metadata } from "next";
import { AdminContentTable, type AdminContentRow } from "@/components/admin/admin-content-table";
import connectMongoDB from "@/lib/mongodb";
import { normalizeProduct } from "@/lib/platform-db";
import Product from "@/models/Product";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Products"
};

function clean<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

export default async function AdminProductsPage() {
  await connectMongoDB();

  const products = clean(
    (await Product.find({}).sort({ isFeatured: -1, downloads: -1, rating: -1, updatedAt: -1 }).limit(120).lean()).map(normalizeProduct)
  );

  const rows: AdminContentRow[] = products.map((product: ReturnType<typeof normalizeProduct>) => ({
    id: String(product.id ?? product.slug),
    title: product.name,
    subtitle: `${product.category ?? "Marketplace"} - ${product.seller ?? "Seller"} - ${product.price}`,
    kind: product.type ?? "product",
    status: product.status ?? "draft",
    isVerified: Boolean(product.isVerified),
    href: product.slug ? `/marketplace/product/${product.slug}` : "/marketplace",
    apiPath: `/api/products/${product.id ?? product.slug}`,
    updateMethod: "PUT",
    statusActions: [
      { label: "Approve", status: "approved" },
      { label: "Publish", status: "published" },
      { label: "Request changes", status: "changes_requested" },
      { label: "Verify badge", patch: { isVerified: true } }
    ],
    editFields: [
      { key: "name", label: "Product name", value: product.name },
      { key: "category", label: "Category", value: product.category ?? "" },
      {
        key: "status",
        label: "Status",
        value: product.status ?? "draft",
        options: ["draft", "submitted", "changes_requested", "approved", "published", "archived"]
      }
    ]
  }));

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8">
      <div>
        <p className="text-sm font-black uppercase tracking-[0.18em] text-[hsl(var(--primary))]">Marketplace products</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">List and moderate products</h1>
        <p className="mt-4 max-w-3xl text-[hsl(var(--muted-foreground))]">
          Review all product records, edit public metadata, publish drafts, share listings and archive unsafe items.
        </p>
      </div>
      <AdminContentTable title="Product records" rows={rows} emptyMessage="No marketplace products have been created yet." />
    </div>
  );
}
