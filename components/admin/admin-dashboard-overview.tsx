"use client";

import Link from "next/link";
import {
  Activity,
  ArrowRight,
  BookOpen,
  BriefcaseBusiness,
  Building2,
  CircleCheck,
  Clock3,
  DollarSign,
  Download,
  Package,
  ReceiptText,
  ShieldCheck,
  ShoppingCart,
  Star,
  Users
} from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ActivityKind = "user" | "course" | "freelancer" | "product" | "payment";

export type AdminDashboardData = {
  metrics: {
    users: number;
    activeUsers: number;
    courses: number;
    freelancers: number;
    products: number;
    orders: number;
    revenueFRW: number;
    revenueUSD: number;
    premiumMembers: number;
  };
  pendingApprovals: Array<{ label: string; value: number; href: string; kind: string }>;
  revenueTrend: Array<{ label: string; value: number }>;
  userGrowth: Array<{ label: string; value: number }>;
  recentActivity: Array<{ id: string; kind: ActivityKind; title: string; detail: string; at: string; href: string }>;
  topCourses: Array<{
    id: string;
    title: string;
    instructor: string;
    students: number;
    revenue: number;
    currency: "FRW" | "USD";
    rating: number;
    image: string;
  }>;
  system: { activeUsers: number; totalUsers: number; catalogRecords: number; openSupport: number; pendingApprovals: number };
};

const iconByKind = {
  course: BookOpen,
  freelancer: BriefcaseBusiness,
  product: Package,
  business: Building2,
  job: ReceiptText,
  user: Users,
  payment: DollarSign
};

function formatFRW(value: number) {
  return `FRW ${Math.round(value).toLocaleString()}`;
}

function formatMoney(value: number, currency: "FRW" | "USD") {
  return currency === "FRW" ? formatFRW(value) : new Intl.NumberFormat("en", { style: "currency", currency: "USD" }).format(value);
}

function relativeTime(value: string) {
  const seconds = Math.max(1, Math.round((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function PanelHeading({ title, href, label = "View all" }: { title: string; href?: string; label?: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <CardTitle className="text-base">{title}</CardTitle>
      {href ? (
        <Link href={href} className="text-xs font-bold text-[hsl(var(--primary))] hover:underline">
          {label}
        </Link>
      ) : null}
    </div>
  );
}

export function AdminDashboardOverview({ data }: { data: AdminDashboardData }) {
  const metrics = [
    { label: "Total users", value: data.metrics.users.toLocaleString(), helper: `${data.metrics.activeUsers.toLocaleString()} active`, icon: Users, tone: "violet" },
    { label: "Total courses", value: data.metrics.courses.toLocaleString(), helper: "Published and in review", icon: BookOpen, tone: "blue" },
    { label: "Freelancers", value: data.metrics.freelancers.toLocaleString(), helper: "Professional profiles", icon: BriefcaseBusiness, tone: "emerald" },
    { label: "Marketplace sales", value: data.metrics.orders.toLocaleString(), helper: `${data.metrics.products.toLocaleString()} products`, icon: ShoppingCart, tone: "orange" },
    { label: "Total revenue", value: formatFRW(data.metrics.revenueFRW), helper: `${formatMoney(data.metrics.revenueUSD, "USD")} USD ledger`, icon: DollarSign, tone: "cyan" },
    { label: "Verified members", value: data.metrics.premiumMembers.toLocaleString(), helper: "Trusted platform accounts", icon: ShieldCheck, tone: "amber" }
  ];

  return (
    <div className="mx-auto w-full max-w-[100rem] space-y-5">
      <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <Badge className="border-[hsl(var(--primary))]/40 text-[hsl(var(--primary))]">Live operations</Badge>
          <h1 className="mt-2 text-3xl font-black">Dashboard</h1>
          <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">Real platform activity, approvals, commerce, and user growth.</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/admin/reports">
            <Download className="size-4" />
            Export report
          </Link>
        </Button>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <Card key={metric.label} className="overflow-hidden rounded-md">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-[hsl(var(--muted-foreground))]">{metric.label}</p>
                    <p className="mt-2 text-xl font-black">{metric.value}</p>
                  </div>
                  <span className={`metric-tone-${metric.tone} grid size-10 place-items-center rounded-md bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))]`}>
                    <Icon className="size-5" />
                  </span>
                </div>
                <p className="mt-3 text-xs text-[hsl(var(--muted-foreground))]">{metric.helper}</p>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.8fr_1.45fr_0.9fr]">
        <Card className="rounded-md">
          <CardHeader className="p-5"><PanelHeading title="Pending approvals" href="/admin/account-applications" /></CardHeader>
          <CardContent className="space-y-2 px-5 pb-5">
            {data.pendingApprovals.map((item) => {
              const Icon = iconByKind[item.kind as keyof typeof iconByKind] ?? Activity;
              return (
                <Link key={item.label} href={item.href} className="flex items-center gap-3 rounded-md border border-[hsl(var(--border))] p-3 transition hover:bg-[hsl(var(--muted))]/60">
                  <span className="grid size-9 place-items-center rounded-md bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))]"><Icon className="size-4" /></span>
                  <span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold">{item.label}</span><span className="text-xs text-[hsl(var(--muted-foreground))]">Awaiting admin review</span></span>
                  <Badge className="font-black">{item.value}</Badge>
                  <ArrowRight className="size-4 text-[hsl(var(--muted-foreground))]" />
                </Link>
              );
            })}
          </CardContent>
        </Card>

        <Card className="rounded-md">
          <CardHeader className="p-5">
            <PanelHeading title="Revenue overview" href="/admin/payments" label="Full report" />
            <p className="pt-2 text-2xl font-black">{formatFRW(data.metrics.revenueFRW)}</p>
          </CardHeader>
          <CardContent className="px-2 pb-4 sm:px-5">
            <div className="h-64 w-full" aria-label="Revenue for the last six months">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.revenueTrend} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                  <defs><linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.32} /><stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.02} /></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} />
                  <YAxis tickLine={false} axisLine={false} fontSize={11} tickFormatter={(value) => `${Math.round(Number(value) / 1000)}K`} />
                  <Tooltip formatter={(value) => formatFRW(Number(value))} contentStyle={{ borderRadius: 6, borderColor: "hsl(var(--border))", background: "hsl(var(--card))" }} />
                  <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2.5} fill="url(#revenueFill)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-md">
          <CardHeader className="p-5"><PanelHeading title="Recent activity" href="/admin/reports" /></CardHeader>
          <CardContent className="space-y-1 px-5 pb-5">
            {data.recentActivity.map((item) => {
              const Icon = iconByKind[item.kind] ?? Activity;
              return (
                <Link key={item.id} href={item.href} className="flex gap-3 border-b border-[hsl(var(--border))] py-3 last:border-0">
                  <span className="grid size-8 shrink-0 place-items-center rounded-md bg-[hsl(var(--muted))] text-[hsl(var(--primary))]"><Icon className="size-4" /></span>
                  <span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold">{item.title}</span><span className="block truncate text-xs text-[hsl(var(--muted-foreground))]">{item.detail}</span></span>
                  <span className="shrink-0 text-[0.68rem] text-[hsl(var(--muted-foreground))]">{relativeTime(item.at)}</span>
                </Link>
              );
            })}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.8fr_1.45fr_0.9fr]">
        <Card className="rounded-md">
          <CardHeader className="p-5">
            <PanelHeading title="User growth" href="/admin/users" label="Manage users" />
            <p className="pt-2 text-2xl font-black">{data.metrics.users.toLocaleString()}</p>
          </CardHeader>
          <CardContent className="px-2 pb-4 sm:px-5">
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.userGrowth} margin={{ top: 8, right: 4, left: -24, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} />
                  <YAxis tickLine={false} axisLine={false} fontSize={11} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: 6, borderColor: "hsl(var(--border))", background: "hsl(var(--card))" }} />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-md overflow-hidden">
          <CardHeader className="p-5"><PanelHeading title="Top performing courses" href="/admin/courses" /></CardHeader>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full min-w-[42rem] text-left text-sm">
              <thead className="border-y border-[hsl(var(--border))] bg-[hsl(var(--muted))]/40 text-xs text-[hsl(var(--muted-foreground))]"><tr><th className="px-5 py-3">Course</th><th className="px-3 py-3">Students</th><th className="px-3 py-3">Est. revenue</th><th className="px-5 py-3 text-right">Rating</th></tr></thead>
              <tbody>
                {data.topCourses.map((course) => (
                  <tr key={course.id} className="border-b border-[hsl(var(--border))] last:border-0">
                    <td className="px-5 py-3"><div className="font-bold">{course.title}</div><div className="text-xs text-[hsl(var(--muted-foreground))]">{course.instructor}</div></td>
                    <td className="px-3 py-3 font-semibold">{course.students.toLocaleString()}</td>
                    <td className="px-3 py-3 font-semibold">{formatMoney(course.revenue, course.currency)}</td>
                    <td className="px-5 py-3 text-right"><span className="inline-flex items-center gap-1 font-bold"><Star className="size-3.5 fill-amber-400 text-amber-400" />{course.rating.toFixed(1)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data.topCourses.length === 0 ? <p className="p-6 text-center text-sm text-[hsl(var(--muted-foreground))]">No published course performance yet.</p> : null}
          </CardContent>
        </Card>

        <Card className="rounded-md">
          <CardHeader className="p-5"><PanelHeading title="System overview" href="/admin/health" /></CardHeader>
          <CardContent className="space-y-2 px-5 pb-5">
            {[
              { label: "Database connection", value: "Operational", icon: CircleCheck, ok: true },
              { label: "Active accounts", value: `${data.system.activeUsers}/${data.system.totalUsers}`, icon: Users, ok: true },
              { label: "Catalog records", value: data.system.catalogRecords.toLocaleString(), icon: Package, ok: true },
              { label: "Pending approvals", value: data.system.pendingApprovals.toLocaleString(), icon: Clock3, ok: data.system.pendingApprovals === 0 },
              { label: "Open support", value: data.system.openSupport.toLocaleString(), icon: Activity, ok: data.system.openSupport === 0 }
            ].map((item) => {
              const Icon = item.icon;
              return <div key={item.label} className="flex items-center gap-3 rounded-md border border-[hsl(var(--border))] p-3"><Icon className={item.ok ? "size-4 text-emerald-500" : "size-4 text-amber-500"} /><span className="min-w-0 flex-1 truncate text-sm font-semibold">{item.label}</span><span className="text-xs text-[hsl(var(--muted-foreground))]">{item.value}</span></div>;
            })}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
