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

export const dynamic = "force-dynamic";

type AdminTool = {
  title: string;
  href: string;
  scope: string;
  actions: string;
  icon: LucideIcon;
};

const adminTools: AdminTool[] = [
  { title: "Users", href: "/admin/users", scope: "Accounts", actions: "View, validate, block, role badges", icon: Users },
  { title: "Applications", href: "/admin/account-applications", scope: "Validation", actions: "Approve, reject, request info", icon: ShieldCheck },
  { title: "Courses", href: "/admin/courses", scope: "Learning", actions: "Review, approve, publish, archive", icon: BookOpen },
  { title: "Products", href: "/admin/marketplace/products", scope: "Marketplace", actions: "Verify, publish, archive", icon: ShoppingBag },
  { title: "Businesses", href: "/admin/shops", scope: "Directory", actions: "Verify, publish, archive", icon: ShoppingBag },
  { title: "Freelancers", href: "/admin/freelancers", scope: "Talent", actions: "Verify, block, archive", icon: BriefcaseBusiness },
  { title: "Jobs", href: "/admin/jobs", scope: "Hiring", actions: "Publish, close, archive", icon: BriefcaseBusiness },
  { title: "Consulting", href: "/admin/consulting/bookings", scope: "Bookings", actions: "Confirm, cancel, review", icon: CalendarDays },
  { title: "Orders", href: "/admin/marketplace/orders", scope: "Commerce", actions: "View, fulfill, refund state", icon: ReceiptText },
  { title: "Payments", href: "/admin/payments", scope: "Finance", actions: "Inspect transactions", icon: CreditCard },
  { title: "Messages", href: "/admin/messages", scope: "Inbox", actions: "Reply, assign, close", icon: MessageSquare },
  { title: "Support", href: "/admin/support", scope: "Tickets", actions: "Resolve, escalate, archive", icon: Headphones },
  { title: "Blogs", href: "/admin/blogs", scope: "Editorial", actions: "Publish, unpublish, archive", icon: Newspaper },
  { title: "Certificates", href: "/admin/certificates", scope: "Credentials", actions: "Issue, verify, inspect", icon: Award },
  { title: "Reports", href: "/admin/reports", scope: "Analytics", actions: "Open reports", icon: BarChart3 },
  { title: "Health", href: "/admin/health", scope: "System", actions: "Check services", icon: Activity },
  { title: "Backups", href: "/admin/backups", scope: "System", actions: "Create, export", icon: Archive },
  { title: "Settings", href: "/admin/settings", scope: "Platform", actions: "Currency, language, policies", icon: Settings }
];

export default function AdminDashboardPage() {
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
