import Link from "next/link";
import { ArrowRight, BarChart3, BookOpen, BriefcaseBusiness, CreditCard, Headphones, ReceiptText, ShieldCheck, ShoppingBag, Sparkles, TrendingUp, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import connectMongoDB from "@/lib/mongodb";
import Booking from "@/models/Booking";
import CertificateCredential from "@/models/CertificateCredential";
import ContactMessage from "@/models/ContactMessage";
import Course from "@/models/Course";
import Gig from "@/models/Gig";
import Order from "@/models/Order";
import Product from "@/models/Product";
import ShopProfile from "@/models/ShopProfile";
import User from "@/models/User";
import WalletTransaction from "@/models/WalletTransaction";

export const dynamic = "force-dynamic";

type AdminSummary = {
  users: number;
  courses: number;
  products: number;
  businesses: number;
  freelancers: number;
  orders: number;
  payments: number;
  bookings: number;
  certificates: number;
  support: number;
  revenueFRW: number;
  revenueUSD: number;
};

function money(value: number, currency: "FRW" | "USD") {
  if (currency === "FRW") {
    return `FRW ${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(Math.round(value))}`;
  }

  return new Intl.NumberFormat("en-US", { currency: "USD", maximumFractionDigits: 2, style: "currency" }).format(value);
}

function percent(value: number, total: number) {
  if (!total) return 0;
  return Math.max(3, Math.round((value / total) * 100));
}

async function getAdminSummary(): Promise<AdminSummary> {
  await connectMongoDB();
  const [
    users,
    courses,
    products,
    businesses,
    freelancers,
    orders,
    payments,
    bookings,
    certificates,
    support,
    revenueRows
  ] = await Promise.all([
    User.countDocuments({}),
    Course.countDocuments({}),
    Product.countDocuments({}),
    ShopProfile.countDocuments({}),
    Gig.distinct("ownerId", { status: { $ne: "archived" } }),
    Order.countDocuments({}),
    WalletTransaction.countDocuments({}),
    Booking.countDocuments({}),
    CertificateCredential.countDocuments({ status: "issued" }),
    ContactMessage.countDocuments({ status: { $in: ["new", "read"] } }),
    WalletTransaction.aggregate([
      {
        $match: {
          status: "completed",
          direction: "credit",
          type: { $in: ["deposit", "course_earning", "product_earning", "consulting_earning", "freelance_earning", "referral_earning", "admin_adjustment"] }
        }
      },
      { $group: { _id: "$currency", total: { $sum: "$amount" } } }
    ])
  ]);

  const revenue = new Map((revenueRows as Array<{ _id: "FRW" | "USD"; total: number }>).map((row) => [row._id, Number(row.total ?? 0)]));

  return {
    users,
    courses,
    products,
    businesses,
    freelancers: freelancers.length,
    orders,
    payments,
    bookings,
    certificates,
    support,
    revenueFRW: revenue.get("FRW") ?? 0,
    revenueUSD: revenue.get("USD") ?? 0
  };
}

export default async function AdminDashboardPage() {
  const summary = await getAdminSummary();
  const studioTotal = summary.courses + summary.products + summary.businesses + summary.freelancers;
  const contentMix = [
    { label: "Courses", value: summary.courses, icon: BookOpen, href: "/admin/courses" },
    { label: "Products", value: summary.products, icon: ShoppingBag, href: "/admin/marketplace/products" },
    { label: "Businesses", value: summary.businesses, icon: ShieldCheck, href: "/admin/shops" },
    { label: "Freelancers", value: summary.freelancers, icon: BriefcaseBusiness, href: "/admin/freelancers" }
  ];
  const highlights = [
    { label: "Review users", value: summary.users, href: "/admin/users", icon: Users },
    { label: "Open support", value: summary.support, href: "/admin/support", icon: Headphones },
    { label: "Marketplace orders", value: summary.orders, href: "/admin/marketplace/orders", icon: ReceiptText },
    { label: "Bookings", value: summary.bookings, href: "/admin/consulting/bookings", icon: CreditCard }
  ];

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Badge className="border-[hsl(var(--primary))]/35 text-[hsl(var(--primary))]">Admin</Badge>
          <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Admin dashboard</h1>
        </div>
        <Button asChild>
          <Link href="/admin/users">
            Users
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Users", value: summary.users.toLocaleString(), helper: "Total platform accounts", icon: Users },
          { label: "Revenue", value: money(summary.revenueFRW, "FRW"), helper: `${money(summary.revenueUSD, "USD")} recorded`, icon: TrendingUp },
          { label: "Orders", value: summary.orders.toLocaleString(), helper: `${summary.payments.toLocaleString()} wallet transactions`, icon: ReceiptText },
          { label: "Support", value: summary.support.toLocaleString(), helper: "Open messages and tickets", icon: Headphones }
        ].map((metric) => {
          const Icon = metric.icon;

          return (
            <Card key={metric.label}>
              <CardContent className="p-4">
                <Icon className="mb-3 size-5 text-[hsl(var(--primary))]" />
                <p className="text-xs font-black uppercase tracking-[0.14em] text-[hsl(var(--muted-foreground))]">{metric.label}</p>
                <p className="mt-2 text-2xl font-black">{metric.value}</p>
                <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">{metric.helper}</p>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <section className="grid gap-5 xl:grid-cols-[1fr_0.85fr]">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle>Data analysis</CardTitle>
              <Badge>{studioTotal.toLocaleString()} studio records</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {contentMix.map((item) => {
              const Icon = item.icon;

              return (
                <Link key={item.label} href={item.href} className="block rounded-md border border-[hsl(var(--border))] p-4 hover:bg-[hsl(var(--muted))]">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="grid size-10 place-items-center rounded-md bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))]">
                        <Icon className="size-5" />
                      </span>
                      <div>
                        <p className="font-black">{item.label}</p>
                        <p className="text-sm text-[hsl(var(--muted-foreground))]">{item.value.toLocaleString()} records</p>
                      </div>
                    </div>
                    <ArrowRight className="size-4 text-[hsl(var(--muted-foreground))]" />
                  </div>
                  <div className="mt-4 h-2 rounded-full bg-[hsl(var(--muted))]">
                    <div className="h-full rounded-full bg-[hsl(var(--primary))]" style={{ width: `${percent(item.value, studioTotal)}%` }} />
                  </div>
                </Link>
              );
            })}
          </CardContent>
        </Card>

        <div className="grid gap-5">
          <Card>
            <CardHeader>
              <CardTitle>Commerce health</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
              {[
                ["Payments", summary.payments],
                ["Bookings", summary.bookings],
                ["Certificates", summary.certificates]
              ].map(([label, value]) => (
                <div key={label} className="rounded-md border border-[hsl(var(--border))] p-4">
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">{label}</p>
                  <p className="mt-2 text-2xl font-black">{Number(value).toLocaleString()}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Sparkles className="size-5 text-[hsl(var(--primary))]" />
                <CardTitle>Highlights</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {highlights.map((item) => {
                const Icon = item.icon;

                return (
                  <Button key={item.label} asChild variant="outline" className="h-auto w-full justify-between p-3">
                    <Link href={item.href}>
                      <span className="flex items-center gap-3">
                        <Icon className="size-4" />
                        {item.label}
                      </span>
                      <span className="font-black">{item.value.toLocaleString()}</span>
                    </Link>
                  </Button>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </section>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <BarChart3 className="size-5 text-[hsl(var(--primary))]" />
            <CardTitle>Quick actions</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Users", "/admin/users"],
            ["Courses", "/admin/courses"],
            ["Products", "/admin/marketplace/products"],
            ["Reports", "/admin/reports"]
          ].map(([label, href]) => (
            <Button key={href} asChild variant="outline" className="justify-between">
              <Link href={href}>
                {label}
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
