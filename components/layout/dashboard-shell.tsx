"use client";

import type { Session } from "next-auth";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Archive,
  Award,
  BarChart3,
  BookOpen,
  Boxes,
  BriefcaseBusiness,
  CalendarDays,
  CircleDollarSign,
  CreditCard,
  GraduationCap,
  Headphones,
  Home,
  LayoutDashboard,
  MessageSquare,
  Newspaper,
  Package,
  ReceiptText,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Upload,
  Users,
  Wallet
} from "lucide-react";
import { logoutAction } from "@/app/(dashboard)/actions";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";
import { AccountSwitcher } from "@/components/account/account-switcher";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import type { NavItem } from "@/types";

const userNavItems: NavItem[] = [
  { href: "/dashboard", label: "User overview", icon: LayoutDashboard },
  { href: "/dashboard/my-courses", label: "My courses", icon: BookOpen },
  { href: "/dashboard/wallet", label: "Wallet", icon: Wallet },
  { href: "/dashboard/referrals", label: "Referrals", icon: Sparkles },
  { href: "/dashboard/orders", label: "Orders", icon: ReceiptText },
  { href: "/dashboard/downloads", label: "Downloads", icon: Package },
  { href: "/dashboard/certificates", label: "Certificates", icon: Award },
  { href: "/dashboard/support", label: "Support", icon: Headphones }
];

const sellerNavItems: NavItem[] = [
  { href: "/seller", label: "Seller overview", icon: ShoppingBag },
  { href: "/seller/shop", label: "Business profile", icon: ShoppingBag },
  { href: "/seller/products", label: "Products", icon: Package },
  { href: "/seller/products/create", label: "Add product", icon: Boxes },
  { href: "/seller/orders", label: "Orders", icon: ReceiptText },
  { href: "/seller/inventory", label: "Inventory", icon: Boxes },
  { href: "/seller/coupons", label: "Discounts", icon: CircleDollarSign },
  { href: "/seller/reviews", label: "Reviews", icon: MessageSquare },
  { href: "/seller/payouts", label: "Payouts", icon: Wallet }
];

const instructorNavItems: NavItem[] = [
  { href: "/instructor", label: "Instructor overview", icon: GraduationCap },
  { href: "/instructor/courses", label: "Courses", icon: BookOpen },
  { href: "/instructor/courses/create", label: "Create course", icon: Sparkles },
  { href: "/instructor/resources", label: "Uploads", icon: Upload },
  { href: "/instructor/assignments", label: "Tests", icon: ShieldCheck },
  { href: "/instructor/students", label: "Students", icon: Users },
  { href: "/instructor/certificates", label: "Certificates", icon: Award },
  { href: "/instructor/earnings", label: "Earnings", icon: Wallet }
];

const consultantNavItems: NavItem[] = [
  { href: "/consultant", label: "Consultant overview", icon: CalendarDays },
  { href: "/consultant/sessions", label: "Sessions", icon: MessageSquare },
  { href: "/consultant/schedule", label: "Schedule", icon: CalendarDays },
  { href: "/consultant/profile", label: "Profile", icon: Users },
  { href: "/consultant/earnings", label: "Earnings", icon: Wallet }
];

const freelancerNavItems: NavItem[] = [
  { href: "/freelancer", label: "Freelancer overview", icon: BriefcaseBusiness },
  { href: "/freelancer/profile", label: "Profile", icon: Users },
  { href: "/freelancer/gigs", label: "Gigs", icon: Package },
  { href: "/freelancer/contracts", label: "Contracts", icon: ReceiptText },
  { href: "/freelancer/portfolio", label: "Portfolio", icon: Upload },
  { href: "/freelancer/earnings", label: "Earnings", icon: Wallet }
];

const adminNavItems: NavItem[] = [
  { href: "/admin/dashboard", label: "Main admin", icon: BarChart3 },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/account-applications", label: "Account applications", icon: ShieldCheck },
  { href: "/admin/messages", label: "Messages", icon: MessageSquare },
  { href: "/admin/instructors", label: "Instructors", icon: GraduationCap },
  { href: "/admin/freelancers", label: "Freelancers", icon: BriefcaseBusiness },
  { href: "/admin/courses", label: "Courses", icon: GraduationCap },
  { href: "/admin/shops", label: "Businesses", icon: ShoppingBag },
  { href: "/admin/marketplace/products", label: "Products", icon: ShoppingBag },
  { href: "/admin/jobs", label: "Jobs", icon: BriefcaseBusiness },
  { href: "/admin/blogs", label: "Blogs", icon: Newspaper },
  { href: "/admin/marketplace/orders", label: "Orders", icon: ReceiptText },
  { href: "/admin/consulting/bookings", label: "Consulting", icon: CalendarDays },
  { href: "/admin/certificates", label: "Certificates", icon: Award },
  { href: "/admin/payments", label: "Payments", icon: CreditCard },
  { href: "/admin/reports", label: "Reports", icon: BarChart3 },
  { href: "/admin/support", label: "Support", icon: Headphones },
  { href: "/admin/health", label: "Health", icon: Activity },
  { href: "/admin/backups", label: "Backups", icon: Archive },
  { href: "/admin/settings", label: "Settings", icon: Settings }
];

const utilityNavItems: NavItem[] = [
  { href: "/messages", label: "Messages", icon: MessageSquare },
  { href: "/profile", label: "Profile", icon: Users },
  { href: "/settings", label: "Account settings", icon: Settings }
];

const navGroups = [
  { key: "user", title: "User dashboard", base: ["/dashboard", "/user"], items: userNavItems },
  { key: "seller", title: "Seller dashboard", base: ["/seller"], items: sellerNavItems },
  { key: "instructor", title: "Instructor dashboard", base: ["/instructor"], items: instructorNavItems },
  { key: "consultant", title: "Consultant dashboard", base: ["/consultant"], items: consultantNavItems },
  { key: "freelancer", title: "Freelancer dashboard", base: ["/freelancer"], items: freelancerNavItems },
  { key: "admin", title: "Main admin", base: ["/admin"], items: adminNavItems },
  { key: "account", title: "Account", base: ["/messages", "/profile", "/notifications", "/settings"], items: utilityNavItems }
];

function getWorkspaceGroup(pathname: string) {
  return (
    navGroups.find((group) =>
      group.base.some((basePath) => pathname === basePath || pathname.startsWith(`${basePath}/`))
    ) ?? navGroups[0]
  );
}

function NavGroup({ title, items }: { title: string; items: NavItem[] }) {
  return (
    <div>
      <p className="px-3 pt-4 text-xs font-semibold uppercase tracking-[0.14em] text-[hsl(var(--muted-foreground))]">
        {title}
      </p>
      <SidebarNav items={items} />
    </div>
  );
}

export function DashboardShell({ children, user }: { children: React.ReactNode; user: Session["user"] }) {
  const pathname = usePathname();
  const workspaceGroup = getWorkspaceGroup(pathname);
  const accountGroup = navGroups.find((group) => group.key === "account") ?? navGroups[0];
  const sidebarGroups = workspaceGroup.key === "account" ? [workspaceGroup] : [workspaceGroup, accountGroup];
  const mobileNavItems = sidebarGroups.flatMap((group) => group.items);

  return (
    <div className="min-h-screen bg-[hsl(var(--muted))]/25">
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-[hsl(var(--border))] bg-[hsl(var(--card))] lg:block">
        <div className="flex h-full flex-col">
          <div className="border-b border-[hsl(var(--border))] px-5 py-5">
            <p className="text-lg font-semibold">MR Creativist</p>
            <p className="mt-1 truncate text-sm text-[hsl(var(--muted-foreground))]">{user.email}</p>
            <Button asChild variant="outline" size="sm" className="mt-4 w-full justify-start">
              <Link href="/">
                <Home className="size-4" />
                Back to Home
              </Link>
            </Button>
            <div className="mt-3 inline-flex rounded-md border border-[hsl(var(--border))] px-2 py-1 text-xs font-medium text-[hsl(var(--muted-foreground))]">
              {user.role ?? "STUDENT"}
            </div>
            {user.validatedRoles?.length ? (
              <p className="mt-2 text-xs text-[hsl(var(--muted-foreground))]">
                Validated: {user.validatedRoles.join(", ")}
              </p>
            ) : null}
          </div>
          <div className="flex-1 overflow-y-auto px-3 pb-4">
            {sidebarGroups.map((group) => (
              <NavGroup key={group.title} title={group.title} items={group.items} />
            ))}
          </div>
          <form action={logoutAction} className="border-t border-[hsl(var(--border))] p-4">
            <Button type="submit" variant="outline" className="w-full">
              Log out
            </Button>
          </form>
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-[hsl(var(--border))] bg-[hsl(var(--background))]/90 px-4 backdrop-blur sm:px-6">
          <div>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">{workspaceGroup.title}</p>
            <p className="font-medium">{user.name ?? "Creative operator"}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/">
                <Home className="size-4" />
                <span className="hidden sm:inline">Back to Home</span>
              </Link>
            </Button>
            <AccountSwitcher activeRole={user.role} />
            <ModeToggle />
            <form action={logoutAction} className="lg:hidden">
              <Button type="submit" variant="outline" size="sm">
                Log out
              </Button>
            </form>
          </div>
        </header>
        <div className="border-b border-[hsl(var(--border))] p-3 lg:hidden">
          <SidebarNav items={mobileNavItems} mobile />
        </div>
        <main className="p-4 sm:p-6 xl:p-8">{children}</main>
      </div>
    </div>
  );
}
