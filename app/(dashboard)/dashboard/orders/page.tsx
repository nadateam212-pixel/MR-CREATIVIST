import type { Metadata } from "next";
import Link from "next/link";
import { CalendarClock, CheckCircle2, Download, Eye, LifeBuoy, PackageCheck, ReceiptText, ShoppingBag } from "lucide-react";
import { auth } from "@/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import connectMongoDB, { hasMongoConfig } from "@/lib/mongodb";
import Order from "@/models/Order";

export const metadata: Metadata = {
  title: "Orders"
};

type OrderItem = {
  name: string;
  slug: string;
  quantity: number;
  unitPrice: number;
};

type BuyerOrder = {
  id: string;
  createdAt?: string;
  updatedAt?: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  currency: string;
  paymentMethod: string;
  status: "pending" | "paid" | "fulfilled" | "refunded" | "cancelled";
};

function money(value: number, currency = "USD") {
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency,
    maximumFractionDigits: 0
  }).format(Number(value ?? 0));
}

function statusTone(status: BuyerOrder["status"]) {
  if (status === "fulfilled") return "border-emerald-500/45 text-emerald-600";
  if (status === "paid") return "border-[hsl(var(--primary))]/45 text-[hsl(var(--primary))]";
  if (status === "pending") return "border-amber-500/45 text-amber-600";
  return "border-[hsl(var(--destructive))]/45 text-[hsl(var(--destructive))]";
}

function stepDone(status: BuyerOrder["status"], step: "paid" | "fulfilled") {
  if (status === "fulfilled") return true;
  return step === "paid" && status === "paid";
}

async function getBuyerOrders(email?: string | null): Promise<BuyerOrder[]> {
  if (!email || !hasMongoConfig()) return [];

  try {
    await connectMongoDB();
    const orders = await Order.find({ buyerEmail: email.toLowerCase() }).sort({ createdAt: -1 }).limit(50).lean();

    return orders.map((order) => ({
      id: String(order._id),
      createdAt: order.createdAt?.toISOString?.() ?? String(order.createdAt ?? ""),
      updatedAt: order.updatedAt?.toISOString?.() ?? String(order.updatedAt ?? ""),
      items: (order.items ?? []).map((item: OrderItem) => ({
        name: item.name,
        slug: item.slug,
        quantity: Number(item.quantity ?? 1),
        unitPrice: Number(item.unitPrice ?? 0)
      })),
      subtotal: Number(order.subtotal ?? 0),
      discount: Number(order.discount ?? 0),
      tax: Number(order.tax ?? 0),
      total: Number(order.total ?? 0),
      currency: order.currency ?? "USD",
      paymentMethod: order.paymentMethod ?? "Checkout",
      status: order.status ?? "pending"
    }));
  } catch {
    return [];
  }
}

export default async function OrdersPage() {
  const session = await auth();
  const orders = await getBuyerOrders(session?.user?.email);
  const paidOrders = orders.filter((order) => ["paid", "fulfilled"].includes(order.status));
  const totalSpent = paidOrders.reduce((total, order) => total + order.total, 0);
  const defaultCurrency = orders[0]?.currency ?? "USD";

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Orders</h1>
          <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">Purchases, delivery status, invoices, and support.</p>
        </div>
        <Button asChild>
          <Link href="/marketplace">
            <ShoppingBag className="size-4" />
            Browse marketplace
          </Link>
        </Button>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          { label: "Orders", value: String(orders.length), icon: ReceiptText },
          { label: "Delivered", value: String(orders.filter((order) => order.status === "fulfilled").length), icon: PackageCheck },
          { label: "Spent", value: money(totalSpent, defaultCurrency), icon: CheckCircle2 }
        ].map((metric) => (
          <Card key={metric.label}>
            <CardContent className="p-5">
              <metric.icon className="mb-4 size-5 text-[hsl(var(--primary))]" />
              <p className="text-sm text-[hsl(var(--muted-foreground))]">{metric.label}</p>
              <p className="mt-1 text-3xl font-semibold">{metric.value}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      {orders.length ? (
        <div className="grid gap-4">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className={statusTone(order.status)}>{order.status}</Badge>
                    <span className="text-sm font-semibold text-[hsl(var(--muted-foreground))]">#{order.id.slice(-8).toUpperCase()}</span>
                  </div>
                  <CardTitle className="mt-3">{money(order.total, order.currency)}</CardTitle>
                  <p className="mt-1 flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))]">
                    <CalendarClock className="size-4" />
                    {order.createdAt ? new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(order.createdAt)) : "Recent"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/marketplace/orders/${order.id}`}>
                      <Eye className="size-4" />
                      Track
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <Link href="/support">
                      <LifeBuoy className="size-4" />
                      Support
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid gap-3 md:grid-cols-3">
                  {[
                    { label: "Paid", ok: stepDone(order.status, "paid") },
                    { label: "Processing", ok: ["paid", "fulfilled"].includes(order.status) },
                    { label: "Delivered", ok: stepDone(order.status, "fulfilled") }
                  ].map((step) => (
                    <div key={step.label} className="flex items-center gap-2 rounded-md border border-[hsl(var(--border))] p-3 text-sm font-semibold">
                      <CheckCircle2 className={step.ok ? "size-4 text-[hsl(var(--primary))]" : "size-4 text-[hsl(var(--muted-foreground))]"} />
                      {step.label}
                    </div>
                  ))}
                </div>

                <div className="divide-y divide-[hsl(var(--border))] rounded-lg border border-[hsl(var(--border))]">
                  {order.items.map((item) => (
                    <div key={`${order.id}-${item.slug}`} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-semibold">{item.name}</p>
                        <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
                          Qty {item.quantity} · {money(item.unitPrice, order.currency)}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/marketplace/product/${item.slug}`}>
                            <Eye className="size-4" />
                            View
                          </Link>
                        </Button>
                        <Button asChild variant="outline" size="sm">
                          <Link href="/dashboard/downloads">
                            <Download className="size-4" />
                            Downloads
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <ReceiptText className="mx-auto mb-4 size-9 text-[hsl(var(--primary))]" />
            <h2 className="text-xl font-semibold">No orders yet</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm text-[hsl(var(--muted-foreground))]">
              Product purchases and template orders will appear here after checkout.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <Button asChild>
                <Link href="/marketplace">Shop products</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/courses">Browse courses</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
