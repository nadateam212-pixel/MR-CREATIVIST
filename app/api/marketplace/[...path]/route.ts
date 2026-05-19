import { apiOk } from "@/lib/api";
import { getProducts } from "@/lib/platform-db";

export async function GET(_request: Request, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  const resource = path.join("/");

  if (resource === "products") {
    const products = await getProducts();
    return apiOk({ items: products });
  }

  if (resource === "cart") {
    return apiOk({ items: [], totals: { subtotal: 0, discount: 0, tax: 0, total: 0 }, mode: "guest-cart" });
  }

  return apiOk({
    resource,
    status: "ready",
    capabilities: ["products", "cart", "checkout", "orders", "discounts", "seller-payouts"]
  });
}

export async function POST(_request: Request, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;

  return apiOk(
    {
      resource: path.join("/"),
      status: "accepted",
      requestId: crypto.randomUUID()
    },
    202
  );
}
