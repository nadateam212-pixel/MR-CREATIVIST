import Link from "next/link";
import {
  Activity,
  BarChart3,
  BookOpen,
  Boxes,
  BriefcaseBusiness,
  CalendarDays,
  CircleDollarSign,
  FileCheck2,
  Gauge,
  GraduationCap,
  HandCoins,
  Headphones,
  Megaphone,
  MessageSquare,
  Package,
  ReceiptText,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Trophy,
  Upload,
  Users,
  Wallet
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { auth } from "@/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PriceDisplay } from "@/components/ui/price-display";
import { getRoleDashboardData } from "@/lib/platform-ledger";

export type DashboardRole = "user" | "client" | "student" | "instructor" | "seller" | "freelancer" | "consultant" | "admin";

type MetricConfig = { label: string; value: string; trend: string; icon: LucideIcon };
type SectionConfig = { title: string; body: string; icon: LucideIcon; items: string[] };
type ToolConfig = { label: string; href: string; icon: LucideIcon };
type DashboardConfig = {
  eyebrow: string;
  title: string;
  description: string;
  primaryAction: { label: string; href: string };
  secondaryAction: { label: string; href: string };
  metrics: MetricConfig[];
  tools: ToolConfig[];
  sections: SectionConfig[];
  pipeline: string[];
};

const learnerTools: ToolConfig[] = [
  { label: "My courses", href: "/dashboard/my-courses", icon: BookOpen },
  { label: "Wallet", href: "/dashboard/wallet", icon: Wallet },
  { label: "Referrals", href: "/dashboard/referrals", icon: HandCoins },
  { label: "Orders", href: "/dashboard/orders", icon: ReceiptText },
  { label: "Downloads", href: "/dashboard/downloads", icon: Package },
  { label: "Certificates", href: "/dashboard/certificates", icon: Trophy },
  { label: "Support", href: "/dashboard/support", icon: Headphones },
  { label: "Messages", href: "/messages", icon: MessageSquare }
];

const dashboardConfig: Record<DashboardRole, DashboardConfig> = {
  user: {
    eyebrow: "Account command center",
    title: "User dashboard",
    description:
      "A complete account workspace for learning, purchases, bookings, wallet activity, certificates, referrals, messages, support, security, and profile controls.",
    primaryAction: { label: "Continue learning", href: "/dashboard/my-courses" },
    secondaryAction: { label: "Browse courses", href: "/courses" },
    metrics: [
      { label: "Learning progress", value: "0%", trend: "Active enrollments", icon: Gauge },
      { label: "Wallet balance", value: "$0", trend: "Ledger-backed funds", icon: Wallet },
      { label: "Certificates", value: "0", trend: "Issued credentials", icon: Trophy },
      { label: "Open support", value: "0", trend: "Unread messages", icon: Headphones }
    ],
    tools: learnerTools,
    sections: [
      {
        title: "Learning",
        body: "Course access from enrollment through assessment and certificate issuance.",
        icon: BookOpen,
        items: ["Continue lessons", "Run quizzes and assignments", "Generate certificates when progress is complete"]
      },
      {
        title: "Commerce",
        body: "Orders, downloads, refunds, invoices, and saved purchase history.",
        icon: ShoppingCart,
        items: ["Track product orders", "Access digital downloads", "Keep invoices and refund records"]
      },
      {
        title: "Wallet and referrals",
        body: "Balance, transactions, transfers, commissions, and payout readiness.",
        icon: HandCoins,
        items: ["Deposit and transfer funds", "Request withdrawals", "Track referral conversions"]
      },
      {
        title: "Account operations",
        body: "Messages, profile, settings, notifications, and support activity.",
        icon: ShieldCheck,
        items: ["Maintain profile details", "Review notifications", "Open and follow support tickets"]
      }
    ],
    pipeline: ["Enrollments", "Lessons", "Quizzes", "Assignments", "Certificates", "Reviews"]
  },
  client: {
    eyebrow: "Client workspace",
    title: "Client dashboard",
    description:
      "A practical client command center for consulting bookings, purchases, wallet transfers, orders, messages, support, and account preferences.",
    primaryAction: { label: "Book consulting", href: "/consulting" },
    secondaryAction: { label: "Browse marketplace", href: "/marketplace" },
    metrics: [
      { label: "Client bookings", value: "0", trend: "Consulting requests and sessions", icon: CalendarDays },
      { label: "Orders", value: "0", trend: "Course, product, and service purchases", icon: ReceiptText },
      { label: "Wallet balance", value: "$0", trend: "Ledger-backed funds", icon: Wallet },
      { label: "Open support", value: "0", trend: "Unread account messages", icon: Headphones }
    ],
    tools: learnerTools,
    sections: [
      {
        title: "Purchasing",
        body: "Everything bought or booked is traceable from the client dashboard.",
        icon: ShoppingCart,
        items: ["View orders", "Download digital assets", "Track consulting bookings"]
      },
      {
        title: "Communication",
        body: "Keep client conversations, support, and notifications in one place.",
        icon: MessageSquare,
        items: ["Message instructors and sellers", "Track support replies", "Keep notification history"]
      },
      {
        title: "Wallet",
        body: "Use wallet funds for transfers, refunds, purchases, and deposits.",
        icon: Wallet,
        items: ["Deposit funds", "Transfer by email", "Export transaction history"]
      }
    ],
    pipeline: ["Browse", "Book or buy", "Pay", "Receive", "Review", "Support"]
  },
  student: {
    eyebrow: "Student learning cockpit",
    title: "Student dashboard",
    description:
      "A focused student workspace for enrolled courses, quiz progress, assignments, downloads, certificates, wallet activity, and learning support.",
    primaryAction: { label: "My courses", href: "/dashboard/my-courses" },
    secondaryAction: { label: "Certificates", href: "/dashboard/certificates" },
    metrics: [
      { label: "Learning progress", value: "0%", trend: "Active enrollments", icon: Gauge },
      { label: "Certificates", value: "0", trend: "Issued credentials", icon: Trophy },
      { label: "Wallet balance", value: "$0", trend: "Refund and referral funds", icon: Wallet },
      { label: "Open support", value: "0", trend: "Unread account messages", icon: Headphones }
    ],
    tools: learnerTools,
    sections: [
      {
        title: "Course progress",
        body: "Learn, score, submit, and unlock certificates.",
        icon: GraduationCap,
        items: ["Continue next lesson", "Improve quiz scores", "Issue eligible certificates"]
      },
      {
        title: "Learning resources",
        body: "Downloads, assignments, recommendations, and course materials.",
        icon: Upload,
        items: ["Access course files", "Submit assignments", "Follow recommendations"]
      },
      {
        title: "Student account",
        body: "Wallet, referrals, orders, support, and profile settings.",
        icon: Settings,
        items: ["Track payments", "Share referral code", "Manage notifications"]
      }
    ],
    pipeline: ["Enroll", "Learn", "Quiz", "Submit", "Certify", "Review"]
  },
  instructor: {
    eyebrow: "Course operating room",
    title: "Instructor dashboard",
    description:
      "End-to-end course production, student management, analytics, assessment, certification, marketing, revenue, and payout operations.",
    primaryAction: { label: "Create course", href: "/instructor/courses/create" },
    secondaryAction: { label: "View courses", href: "/instructor/courses" },
    metrics: [
      { label: "Course revenue", value: "$0", trend: "Courses tracked", icon: CircleDollarSign },
      { label: "Active students", value: "0", trend: "Students in your courses", icon: Users },
      { label: "Completion rate", value: "0%", trend: "Average learner progress", icon: BarChart3 },
      { label: "Pending grading", value: "0", trend: "Assignments and reviews", icon: FileCheck2 }
    ],
    tools: [
      { label: "Create course", href: "/instructor/courses/create", icon: Sparkles },
      { label: "Courses", href: "/instructor/courses", icon: BookOpen },
      { label: "Uploads", href: "/instructor/resources", icon: Upload },
      { label: "Tests", href: "/instructor/assignments", icon: FileCheck2 },
      { label: "Students", href: "/instructor/students", icon: Users },
      { label: "Certificates", href: "/instructor/certificates", icon: Trophy },
      { label: "Earnings", href: "/instructor/earnings", icon: Wallet },
      { label: "Payouts", href: "/instructor/payouts", icon: HandCoins }
    ],
    sections: [
      {
        title: "Course management",
        body: "Create, edit, import, publish, and optimize courses.",
        icon: GraduationCap,
        items: ["Course builder", "Lesson resources", "Quiz and assignment workflows"]
      },
      {
        title: "Student success",
        body: "Know who is learning, struggling, or ready to certify.",
        icon: Users,
        items: ["Roster and progress", "Messages and announcements", "Certificate readiness"]
      },
      {
        title: "Revenue and payouts",
        body: "Wallet-backed instructor monetization.",
        icon: Wallet,
        items: ["Course earnings", "Payout requests", "Tax-ready exports"]
      }
    ],
    pipeline: ["Draft", "Upload", "Quiz", "Review", "Publish", "Payout"]
  },
  seller: {
    eyebrow: "Marketplace control panel",
    title: "Seller dashboard",
    description:
      "A seller workspace for product catalog, inventory, orders, digital delivery, reviews, discounts, customers, analytics, and payouts.",
    primaryAction: { label: "Add product", href: "/seller/products/create" },
    secondaryAction: { label: "Manage orders", href: "/seller/orders" },
    metrics: [
      { label: "Store revenue", value: "$0", trend: "Products tracked", icon: CircleDollarSign },
      { label: "Open orders", value: "0", trend: "Paid, pending, and fulfilled orders", icon: Package },
      { label: "Conversion", value: "0%", trend: "Orders per active product", icon: Gauge },
      { label: "Low stock", value: "0", trend: "Products at or below 3 units", icon: Boxes }
    ],
    tools: [
      { label: "Add product", href: "/seller/products/create", icon: Package },
      { label: "Products", href: "/seller/products", icon: ShoppingCart },
      { label: "Inventory", href: "/seller/inventory", icon: Boxes },
      { label: "Orders", href: "/seller/orders", icon: ReceiptText },
      { label: "Downloads", href: "/seller/digital-downloads", icon: Upload },
      { label: "Coupons", href: "/seller/coupons", icon: Megaphone },
      { label: "Customers", href: "/seller/customers", icon: Users },
      { label: "Payouts", href: "/seller/payouts", icon: Wallet }
    ],
    sections: [
      {
        title: "Product operations",
        body: "Publish and sell digital, physical, template, software, and service products.",
        icon: Package,
        items: ["Product listings", "Inventory and SKU controls", "Digital files and licenses"]
      },
      {
        title: "Fulfillment",
        body: "Track orders from checkout to delivery, download, return, or dispute.",
        icon: ReceiptText,
        items: ["Order status", "Refunds and returns", "Customer messages"]
      },
      {
        title: "Growth and payouts",
        body: "Use campaigns, reviews, analytics, and wallet payouts to grow.",
        icon: HandCoins,
        items: ["Coupons", "Review responses", "Seller earnings"]
      }
    ],
    pipeline: ["Draft", "Inventory", "Discount", "Order", "Fulfill", "Payout"]
  },
  freelancer: {
    eyebrow: "Freelance studio",
    title: "Freelancer dashboard",
    description:
      "A freelancer workspace for verified profiles, gigs, contracts, milestones, escrow records, portfolio proof, reviews, messages, and payouts.",
    primaryAction: { label: "Manage gigs", href: "/freelancer/gigs" },
    secondaryAction: { label: "Contracts", href: "/freelancer/contracts" },
    metrics: [
      { label: "Freelance revenue", value: "$0", trend: "Contract records", icon: CircleDollarSign },
      { label: "Gigs", value: "0", trend: "Public service offers", icon: BriefcaseBusiness },
      { label: "Completed jobs", value: "0", trend: "Profile performance", icon: FileCheck2 },
      { label: "Payout ready", value: "$0", trend: "Available wallet balance", icon: Wallet }
    ],
    tools: [
      { label: "Profile", href: "/freelancer/profile", icon: Users },
      { label: "Gigs", href: "/freelancer/gigs", icon: BriefcaseBusiness },
      { label: "Contracts", href: "/freelancer/contracts", icon: ReceiptText },
      { label: "Portfolio", href: "/freelancer/portfolio", icon: Upload },
      { label: "Earnings", href: "/freelancer/earnings", icon: Wallet },
      { label: "Messages", href: "/messages", icon: MessageSquare }
    ],
    sections: [
      {
        title: "Services",
        body: "Create gig packages, rates, delivery windows, and portfolio-backed offers.",
        icon: BriefcaseBusiness,
        items: ["Gig pricing", "Availability", "Skills and proof"]
      },
      {
        title: "Contracts",
        body: "Track briefs, milestones, approvals, revisions, and handoff records.",
        icon: ReceiptText,
        items: ["Milestones", "Escrow notes", "Client approval"]
      },
      {
        title: "Earnings",
        body: "Release completed work into wallet and request payouts.",
        icon: Wallet,
        items: ["Freelance earnings", "Payout requests", "Transaction export"]
      }
    ],
    pipeline: ["Profile", "Gig", "Proposal", "Contract", "Delivery", "Payout"]
  },
  consultant: {
    eyebrow: "Consulting command center",
    title: "Consultant dashboard",
    description:
      "A consultant workspace for service packages, booking requests, schedules, client notes, session outcomes, ratings, earnings, and payouts.",
    primaryAction: { label: "Sessions", href: "/consultant/sessions" },
    secondaryAction: { label: "Schedule", href: "/consultant/schedule" },
    metrics: [
      { label: "Consulting revenue", value: "$0", trend: "Services tracked", icon: CircleDollarSign },
      { label: "Bookings", value: "0", trend: "Requests and sessions", icon: CalendarDays },
      { label: "Client rating", value: "0.0", trend: "Average service rating", icon: Gauge },
      { label: "Payout ready", value: "$0", trend: "Available wallet balance", icon: Wallet }
    ],
    tools: [
      { label: "Sessions", href: "/consultant/sessions", icon: CalendarDays },
      { label: "Schedule", href: "/consultant/schedule", icon: Activity },
      { label: "Profile", href: "/consultant/profile", icon: Users },
      { label: "Earnings", href: "/consultant/earnings", icon: Wallet },
      { label: "Messages", href: "/messages", icon: MessageSquare },
      { label: "Support", href: "/dashboard/support", icon: Headphones }
    ],
    sections: [
      {
        title: "Bookings",
        body: "Run upcoming and past sessions with notes, links, and outcomes.",
        icon: CalendarDays,
        items: ["Session calendar", "Client notes", "Follow-up records"]
      },
      {
        title: "Service profile",
        body: "Keep expertise, packages, rates, languages, and availability current.",
        icon: Users,
        items: ["Expertise", "Pricing", "Availability"]
      },
      {
        title: "Consulting revenue",
        body: "Confirmed bookings calculate into wallet-ready earnings.",
        icon: Wallet,
        items: ["Session earnings", "Payout requests", "Revenue export"]
      }
    ],
    pipeline: ["Profile", "Availability", "Booking", "Session", "Follow-up", "Payout"]
  },
  admin: {
    eyebrow: "Super admin operations",
    title: "Main admin dashboard",
    description:
      "Platform-wide control for users, content moderation, finance, analytics, support, compliance, integrations, system health, and developer tooling.",
    primaryAction: { label: "Review reports", href: "/admin/reports" },
    secondaryAction: { label: "Manage users", href: "/admin/users" },
    metrics: [
      { label: "Platform revenue", value: "$0", trend: "Courses, commerce, consulting", icon: CircleDollarSign },
      { label: "Active users", value: "0", trend: "Cohort health", icon: Users },
      { label: "Approval queue", value: "0", trend: "Courses, products, consultants", icon: FileCheck2 },
      { label: "System health", value: "Ready", trend: "Backups and logs", icon: Activity }
    ],
    tools: [
      { label: "Users", href: "/admin/users", icon: Users },
      { label: "Courses", href: "/admin/courses", icon: GraduationCap },
      { label: "Products", href: "/admin/marketplace/products", icon: ShoppingCart },
      { label: "Orders", href: "/admin/marketplace/orders", icon: ReceiptText },
      { label: "Payments", href: "/admin/payments", icon: HandCoins },
      { label: "Health", href: "/admin/health", icon: Activity }
    ],
    sections: [],
    pipeline: ["Monitor", "Approve", "Moderate", "Finance", "Audit", "Backup"]
  }
};

function mergeMetric(metric: MetricConfig, live?: { value?: string; trend?: string }) {
  return {
    ...metric,
    value: live?.value ?? metric.value,
    trend: live?.trend ?? metric.trend
  };
}

function resolveRole(role: DashboardRole, activeRole?: string): DashboardRole {
  if (role !== "user") return role;
  if (activeRole === "client" || activeRole === "student") return activeRole;
  return "user";
}

function isMoneyValue(value: string) {
  return value.trim().startsWith("$") || /\b(FRW|RWF|USD)\b/i.test(value);
}

export async function PlatformDashboard({ role }: { role: DashboardRole }) {
  const session = await auth();
  const resolvedRole = resolveRole(role, session?.user?.role);
  const config = dashboardConfig[resolvedRole];
  const live = session?.user ? await getRoleDashboardData(resolvedRole, session.user).catch(() => null) : null;
  const liveMetrics = (live?.metrics ?? {}) as Record<string, { value?: string; trend?: string }>;
  const metrics = config.metrics.map((metric) => mergeMetric(metric, liveMetrics[metric.label]));

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-4xl">
          <p className="text-sm font-medium text-[hsl(var(--primary))]">{config.eyebrow}</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-5xl">{config.title}</h1>
          <p className="mt-4 text-base leading-7 text-[hsl(var(--muted-foreground))] sm:text-lg">{config.description}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href={config.primaryAction.href}>{config.primaryAction.label}</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={config.secondaryAction.href}>{config.secondaryAction.label}</Link>
          </Button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;

          return (
            <Card key={metric.label}>
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-[hsl(var(--muted-foreground))]">{metric.label}</CardTitle>
                <Icon className="size-5 text-[hsl(var(--primary))]" />
              </CardHeader>
              <CardContent>
                {isMoneyValue(metric.value) ? (
                  <PriceDisplay price={metric.value} className="text-3xl tracking-tight" />
                ) : (
                  <p className="text-3xl font-semibold tracking-tight">{metric.value}</p>
                )}
                <p className="mt-2 text-sm leading-5 text-[hsl(var(--muted-foreground))]">{metric.trend}</p>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_0.72fr]">
        <Card>
          <CardHeader>
            <CardTitle>Tool launcher</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {config.tools.map((tool) => {
              const Icon = tool.icon;

              return (
                <Button key={tool.href} asChild variant="outline" className="h-auto justify-start p-4">
                  <Link href={tool.href}>
                    <Icon className="size-4 text-[hsl(var(--primary))]" />
                    {tool.label}
                  </Link>
                </Button>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Operating pipeline</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {config.pipeline.map((step, index) => (
              <div key={step} className="flex items-center gap-3 rounded-md border border-[hsl(var(--border))] p-3 text-sm">
                <Badge>{String(index + 1).padStart(2, "0")}</Badge>
                <span className="font-medium">{step}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      {live?.records?.length ? (
        <Card>
          <CardHeader>
            <CardTitle>Recent platform activity</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {live.records.map((record: { id: string; title: string; status: string; updatedAt: string }) => (
              <div key={record.id} className="rounded-md border border-[hsl(var(--border))] p-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-semibold">{record.title}</p>
                  <Badge>{record.status.replaceAll("_", " ")}</Badge>
                </div>
                <p className="mt-2 text-xs text-[hsl(var(--muted-foreground))]">
                  {new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(record.updatedAt))}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-3">
        {config.sections.map((section) => {
          const Icon = section.icon;

          return (
            <Card key={section.title}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Icon className="size-5 text-[hsl(var(--primary))]" />
                  <CardTitle>{section.title}</CardTitle>
                </div>
                <p className="pt-2 text-sm leading-6 text-[hsl(var(--muted-foreground))]">{section.body}</p>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  {section.items.map((item) => (
                    <div key={item} className="flex gap-3 text-sm leading-6">
                      <Badge className="mt-1 h-5 shrink-0">Live</Badge>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </section>
    </div>
  );
}
