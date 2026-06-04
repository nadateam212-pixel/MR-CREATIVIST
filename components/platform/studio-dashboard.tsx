"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  FileText,
  GraduationCap,
  Package,
  Settings,
  ShoppingBag,
  Sparkles,
  Upload,
  Wallet
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type StudioCategory = "Create new" | "Manage" | "Analytics" | "Settings";

type StudioTool = {
  title: string;
  href: string;
  icon: LucideIcon;
  category: StudioCategory;
  meta: string;
};

type StudioOwner = {
  name?: string | null;
  email?: string | null;
  studioId: string;
  role?: string | null;
  accountStatus?: string | null;
};

export type StudioSummary = {
  courses: number;
  products: number;
  gigs: number;
  businesses: number;
  consulting: number;
  freelancerProfiles: number;
  published: number;
  drafts: number;
  review: number;
  archived: number;
  verified: number;
  total: number;
};

const categories: StudioCategory[] = ["Create new", "Manage", "Analytics", "Settings"];

const studioTools: StudioTool[] = [
  { title: "Create course", href: "/instructor/courses/create", icon: GraduationCap, category: "Create new", meta: "Private draft, admin approval before public" },
  { title: "Add product", href: "/seller/products/create", icon: Package, category: "Create new", meta: "Publishes under your Studio" },
  { title: "Business profile", href: "/seller/shop", icon: Building2, category: "Create new", meta: "Storefront, contacts, services" },
  { title: "Freelancer gig", href: "/freelancer/gigs", icon: BriefcaseBusiness, category: "Create new", meta: "Service packages and requests" },
  { title: "Consulting service", href: "/consultant/profile", icon: CalendarDays, category: "Create new", meta: "Bookings, sessions, rates" },
  { title: "Courses", href: "/instructor/courses", icon: BookOpen, category: "Manage", meta: "Owned courses and review states" },
  { title: "Products", href: "/seller/products", icon: ShoppingBag, category: "Manage", meta: "Catalog, pricing, downloads" },
  { title: "Uploads", href: "/instructor/resources", icon: Upload, category: "Manage", meta: "Course files and resources" },
  { title: "Earnings", href: "/instructor/earnings", icon: Wallet, category: "Analytics", meta: "Revenue and payouts" },
  { title: "Performance", href: "/dashboard", icon: BarChart3, category: "Analytics", meta: "Learning, sales, wallet signals" },
  { title: "Public profile", href: "/profile", icon: FileText, category: "Settings", meta: "Creator identity" },
  { title: "Account settings", href: "/settings", icon: Settings, category: "Settings", meta: "Language and currency" }
];

const defaultSummary: StudioSummary = {
  courses: 0,
  products: 0,
  gigs: 0,
  businesses: 0,
  consulting: 0,
  freelancerProfiles: 0,
  published: 0,
  drafts: 0,
  review: 0,
  archived: 0,
  verified: 0,
  total: 0
};

export function StudioDashboard({
  owner,
  summary = defaultSummary
}: {
  owner?: StudioOwner;
  summary?: StudioSummary;
}) {
  const [activeCategory, setActiveCategory] = useState<StudioCategory>("Create new");
  const tools = useMemo(
    () => studioTools.filter((tool) => tool.category === activeCategory),
    [activeCategory]
  );
  const stats = useMemo(
    () => [
      { label: "Live public", value: String(summary.published), tone: "bg-emerald-500" },
      { label: "Drafts", value: String(summary.drafts), tone: "bg-sky-500" },
      { label: "Admin review", value: String(summary.review), tone: "bg-amber-500" },
      { label: "Studio records", value: String(summary.total), tone: "bg-violet-500" }
    ],
    [summary]
  );
  const bars = useMemo(() => {
    const items = [
      { label: "Courses", count: summary.courses },
      { label: "Products", count: summary.products },
      { label: "Gigs", count: summary.gigs },
      { label: "Business", count: summary.businesses },
      { label: "Consulting", count: summary.consulting + summary.freelancerProfiles }
    ];
    const max = Math.max(1, ...items.map((item) => item.count));

    return items.map((item) => ({ ...item, value: Math.round((item.count / max) * 100) }));
  }, [summary]);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <section className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Badge className="border-[hsl(var(--primary))]/35 text-[hsl(var(--primary))]">MrC. Studio</Badge>
            <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Studio</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setActiveCategory(category)}
                className={cn(
                  "min-h-10 rounded-md border px-4 text-sm font-black transition-colors",
                  activeCategory === category
                    ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
                    : "border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]"
                )}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 grid gap-3 xl:grid-cols-[1fr_22rem]">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((item) => (
              <div key={item.label} className="rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-4">
                <span className={cn("mb-4 block h-1.5 w-12 rounded-full", item.tone)} />
                <p className="text-sm font-semibold text-[hsl(var(--muted-foreground))]">{item.label}</p>
                <p className="mt-2 text-2xl font-black">{item.value}</p>
              </div>
            ))}
          </div>
          <div className="rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[hsl(var(--muted-foreground))]">Private Studio ID</p>
                <p className="mt-2 truncate font-mono text-lg font-black">{owner?.studioId ?? "MRC-STUDIO"}</p>
              </div>
              <Badge>Owner scoped</Badge>
            </div>
            <p className="mt-3 truncate text-sm font-semibold text-[hsl(var(--muted-foreground))]">{owner?.name ?? "Studio owner"} - {owner?.email ?? "No email"}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1fr_24rem]">
        <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-black">{activeCategory}</h2>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">Create and manage records inside your own Studio.</p>
            </div>
            <Sparkles className="size-5 text-[hsl(var(--primary))]" />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {tools.map((tool) => {
              const Icon = tool.icon;

              return (
                <Link
                  key={tool.href}
                  href={tool.href}
                  className="group rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-4 transition-colors hover:border-[hsl(var(--primary))]/55 hover:bg-[hsl(var(--primary))]/5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="grid size-11 place-items-center rounded-md bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))]">
                      <Icon className="size-5" />
                    </span>
                    <ArrowRight className="size-5 text-[hsl(var(--muted-foreground))] transition-transform group-hover:translate-x-1 group-hover:text-[hsl(var(--primary))]" />
                  </div>
                  <h3 className="mt-5 text-lg font-black">{tool.title}</h3>
                  <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">{tool.meta}</p>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-black">Studio map</h2>
              <Badge>{summary.verified} verified</Badge>
            </div>
            <div className="mt-5 grid gap-3">
              {bars.map((item) => (
                <div key={item.label}>
                  <div className="mb-2 flex items-center justify-between text-sm font-semibold">
                    <span>{item.label}</span>
                    <span>{item.count}</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-[hsl(var(--muted))]">
                    <span className="block h-full rounded-full bg-[hsl(var(--primary))]" style={{ width: `${item.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 shadow-sm">
            <h2 className="text-lg font-black">Publishing rules</h2>
            <div className="mt-4 grid gap-3 text-sm font-semibold text-[hsl(var(--muted-foreground))]">
              <p className="rounded-md border border-[hsl(var(--border))] p-3">Courses stay private or in review until an admin approves publication.</p>
              <p className="rounded-md border border-[hsl(var(--border))] p-3">Products, gigs, business profiles, and consulting services publish under your Studio ownership.</p>
              <p className="rounded-md border border-[hsl(var(--border))] p-3">Verification adds the public check mark and unlocks trusted checkout where applicable.</p>
            </div>
          </div>

          <Button asChild className="h-12 w-full justify-between px-4">
            <Link href="/instructor/courses/create">
              <span className="inline-flex items-center gap-2">
                <Sparkles className="size-4" />
                New course
              </span>
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
