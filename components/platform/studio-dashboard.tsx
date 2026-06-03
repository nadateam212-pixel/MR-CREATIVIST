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

const categories: StudioCategory[] = ["Create new", "Manage", "Analytics", "Settings"];

const studioTools: StudioTool[] = [
  { title: "Create course", href: "/instructor/courses/create", icon: GraduationCap, category: "Create new", meta: "Google Drive lessons" },
  { title: "Add product", href: "/seller/products/create", icon: Package, category: "Create new", meta: "Digital or service" },
  { title: "Business profile", href: "/seller/shop", icon: Building2, category: "Create new", meta: "Public listing" },
  { title: "Freelancer gig", href: "/freelancer/gigs", icon: BriefcaseBusiness, category: "Create new", meta: "Service packages" },
  { title: "Consulting service", href: "/consultant/profile", icon: CalendarDays, category: "Create new", meta: "Bookings and rates" },
  { title: "Courses", href: "/instructor/courses", icon: BookOpen, category: "Manage", meta: "Drafts and review" },
  { title: "Products", href: "/seller/products", icon: ShoppingBag, category: "Manage", meta: "Catalog and orders" },
  { title: "Uploads", href: "/instructor/resources", icon: Upload, category: "Manage", meta: "Files and resources" },
  { title: "Earnings", href: "/instructor/earnings", icon: Wallet, category: "Analytics", meta: "Revenue and payouts" },
  { title: "Performance", href: "/dashboard", icon: BarChart3, category: "Analytics", meta: "Views and sales" },
  { title: "Public profile", href: "/profile", icon: FileText, category: "Settings", meta: "Creator identity" },
  { title: "Account settings", href: "/settings", icon: Settings, category: "Settings", meta: "Language and currency" }
];

const stats = [
  { label: "Published", value: "24", tone: "bg-emerald-500" },
  { label: "Drafts", value: "7", tone: "bg-sky-500" },
  { label: "Review", value: "5", tone: "bg-amber-500" },
  { label: "Revenue", value: "FRW 2.4M", tone: "bg-violet-500" }
];

const bars = [
  { label: "Courses", value: 74 },
  { label: "Products", value: 52 },
  { label: "Gigs", value: 38 },
  { label: "Business", value: 61 },
  { label: "Consulting", value: 44 }
];

export function StudioDashboard() {
  const [activeCategory, setActiveCategory] = useState<StudioCategory>("Create new");
  const tools = useMemo(
    () => studioTools.filter((tool) => tool.category === activeCategory),
    [activeCategory]
  );

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

        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((item) => (
            <div key={item.label} className="rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-4">
              <span className={cn("mb-4 block h-1.5 w-12 rounded-full", item.tone)} />
              <p className="text-sm font-semibold text-[hsl(var(--muted-foreground))]">{item.label}</p>
              <p className="mt-2 text-2xl font-black">{item.value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1fr_24rem]">
        <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-black">{activeCategory}</h2>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">Choose one tool and continue.</p>
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
              <h2 className="text-lg font-black">Activity</h2>
              <Badge>Live</Badge>
            </div>
            <div className="mt-5 grid gap-3">
              {bars.map((item) => (
                <div key={item.label}>
                  <div className="mb-2 flex items-center justify-between text-sm font-semibold">
                    <span>{item.label}</span>
                    <span>{item.value}%</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-[hsl(var(--muted))]">
                    <span className="block h-full rounded-full bg-[hsl(var(--primary))]" style={{ width: `${item.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 shadow-sm">
            <h2 className="text-lg font-black">Publishing Mix</h2>
            <div className="mt-5 flex items-center gap-5">
              <div
                className="size-32 shrink-0 rounded-full"
                style={{
                  background:
                    "conic-gradient(hsl(var(--primary)) 0 42%, #22c55e 42% 64%, #f59e0b 64% 82%, #8b5cf6 82% 100%)"
                }}
              />
              <div className="grid gap-2 text-sm font-semibold text-[hsl(var(--muted-foreground))]">
                <span>Courses 42%</span>
                <span>Products 22%</span>
                <span>Gigs 18%</span>
                <span>Business 18%</span>
              </div>
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
