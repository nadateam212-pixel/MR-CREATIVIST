import Link from "next/link";
import {
  Activity,
  Archive,
  ArrowRight,
  Award,
  BarChart3,
  BookOpen,
  BriefcaseBusiness,
  CalendarDays,
  CreditCard,
  Headphones,
  MessageSquare,
  Newspaper,
  ReceiptText,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Users
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
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

type AdminTool = {
  title: string;
  href: string;
  scope: string;
  actions: string;
  icon: LucideIcon;
  countKey?: keyof AdminSummary;
};

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
};

const adminTools: AdminTool[] = [
  { title: "Users", href: "/admin/users", scope: "Accounts", actions: "View, validate, block, role badges", icon: Users, countKey: "users" },
  { title: "Applications", href: "/admin/account-applications", scope: "Validation", actions: "Approve, reject, request info", icon: ShieldCheck },
  { title: "Courses", href: "/admin/courses", scope: "Learning", actions: "Review, approve, publish, archive", icon: BookOpen, countKey: "courses" },
  { title: "Products", href: "/admin/marketplace/products", scope: "Marketplace", actions: "Verify, publish, archive", icon: ShoppingBag, countKey: "products" },
  { title: "Businesses", href: "/admin/shops", scope: "Directory", actions: "Verify, publish, archive", icon: ShoppingBag, countKey: "businesses" },
  { title: "Freelancers", href: "/admin/freelancers", scope: "Talent", actions: "Verify, block, archive", icon: BriefcaseBusiness, countKey: "freelancers" },
  { title: "Jobs", href: "/admin/jobs", scope: "Hiring", actions: "Publish, close, archive", icon: BriefcaseBusiness },
  { title: "Consulting", href: "/admin/consulting/bookings", scope: "Bookings", actions: "Confirm, cancel, review", icon: CalendarDays, countKey: "bookings" },
  { title: "Orders", href: "/admin/marketplace/orders", scope: "Commerce", actions: "View, fulfill, refund state", icon: ReceiptText, countKey: "orders" },
  { title: "Payments", href: "/admin/payments", scope: "Finance", actions: "Inspect transactions", icon: CreditCard, countKey: "payments" },
  { title: "Messages", href: "/admin/messages", scope: "Inbox", actions: "Reply, assign, close", icon: MessageSquare },
  { title: "Support", href: "/admin/support", scope: "Tickets", actions: "Resolve, escalate, archive", icon: Headphones, countKey: "support" },
  { title: "Blogs", href: "/admin/blogs", scope: "Editorial", actions: "Publish, unpublish, archive", icon: Newspaper },
  { title: "Certificates", href: "/admin/certificates", scope: "Credentials", actions: "Issue, verify, inspect", icon: Award, countKey: "certificates" },
  { title: "Reports", href: "/admin/reports", scope: "Analytics", actions: "Open reports", icon: BarChart3 },
  { title: "Health", href: "/admin/health", scope: "System", actions: "Check services", icon: Activity },
  { title: "Backups", href: "/admin/backups", scope: "System", actions: "Create, export", icon: Archive },
  { title: "Settings", href: "/admin/settings", scope: "Platform", actions: "Currency, language, policies", icon: Settings }
];

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
    support
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
    ContactMessage.countDocuments({ status: { $in: ["new", "read"] } })
  ]);

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
    support
  };
}

export default async function AdminDashboardPage() {
  const summary = await getAdminSummary();
  const moderationTotal = summary.courses + summary.products + summary.businesses + summary.freelancers;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Badge className="border-[hsl(var(--primary))]/35 text-[hsl(var(--primary))]">Admin</Badge>
          <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Management console</h1>
        </div>
        <Button asChild variant="outline">
          <Link href="/">
            Public site
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Accounts", value: summary.users, helper: "Registered users", icon: Users },
          { label: "Studio records", value: moderationTotal, helper: "Courses, products, businesses, gig owners", icon: Sparkles },
          { label: "Commerce", value: summary.orders, helper: "Marketplace orders", icon: ReceiptText },
          { label: "Open support", value: summary.support, helper: "Contact tickets requiring staff", icon: Headphones }
        ].map((metric) => {
          const Icon = metric.icon;

          return (
            <Card key={metric.label}>
              <CardContent className="p-4">
                <Icon className="mb-3 size-5 text-[hsl(var(--primary))]" />
                <p className="text-xs font-black uppercase tracking-[0.14em] text-[hsl(var(--muted-foreground))]">{metric.label}</p>
                <p className="mt-2 text-3xl font-black">{metric.value.toLocaleString()}</p>
                <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">{metric.helper}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Admin tools</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[64rem] text-left text-sm">
            <thead className="border-y border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))]">
              <tr>
                <th className="p-4 font-medium">Tool</th>
                <th className="p-4 font-medium">Scope</th>
                <th className="p-4 font-medium">Records</th>
                <th className="p-4 font-medium">Admin actions</th>
                <th className="p-4 text-right font-medium">Open</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[hsl(var(--border))]">
              {adminTools.map((tool) => {
                const Icon = tool.icon;

                return (
                  <tr key={tool.href}>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <span className="grid size-10 place-items-center rounded-md bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))]">
                          <Icon className="size-5" />
                        </span>
                        <span className="font-black">{tool.title}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge>{tool.scope}</Badge>
                    </td>
                    <td className="p-4 font-black">{tool.countKey ? summary[tool.countKey].toLocaleString() : "-"}</td>
                    <td className="p-4 text-[hsl(var(--muted-foreground))]">{tool.actions}</td>
                    <td className="p-4 text-right">
                      <Button asChild size="sm">
                        <Link href={tool.href}>
                          Manage
                          <ArrowRight className="size-4" />
                        </Link>
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
        <div className="flex items-center gap-3">
          <Sparkles className="size-5 text-[hsl(var(--primary))]" />
          <p className="font-semibold">Open a tool to see records, approvals, details, and action buttons.</p>
        </div>
      </div>
    </div>
  );
}
