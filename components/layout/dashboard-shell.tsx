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
  Bell,
  ChevronDown,
  CreditCard,
  GraduationCap,
  Headphones,
  Home,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Newspaper,
  Package,
  ReceiptText,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Upload,
  UserRound,
  Users,
  Wallet
} from "lucide-react";
import { logoutAction } from "@/app/(dashboard)/actions";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import type { NavItem } from "@/types";

const normalNavItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/my-courses", label: "My courses", icon: BookOpen },
  { href: "/dashboard/certificates", label: "Certificates", icon: Award },
  { href: "/dashboard/downloads", label: "Downloads", icon: Package },
  { href: "/dashboard/orders", label: "Orders", icon: ReceiptText },
  { href: "/dashboard/wallet", label: "Wallet", icon: Wallet },
  { href: "/profile", label: "Profile", icon: Users }
];

const studioNavItems: NavItem[] = [
  { href: "/studio", label: "MrC. Studio", icon: Sparkles },
  { href: "/instructor/courses/create", label: "Create course", icon: GraduationCap },
  { href: "/instructor/courses", label: "Courses", icon: BookOpen },
  { href: "/seller/products", label: "Products", icon: Package },
  { href: "/seller/products/create", label: "Add product", icon: Boxes },
  { href: "/seller/shop", label: "Business", icon: ShoppingBag },
  { href: "/freelancer/gigs", label: "Gigs", icon: BriefcaseBusiness },
  { href: "/consultant/profile", label: "Consulting", icon: CalendarDays },
  { href: "/instructor/resources", label: "Uploads", icon: Upload },
  { href: "/instructor/earnings", label: "Earnings", icon: Wallet }
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
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/studio", label: "MrC. Studio", icon: Sparkles },
  { href: "/profile", label: "Profile", icon: UserRound },
  { href: "/messages", label: "Messages", icon: MessageSquare },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/settings", label: "Settings", icon: Settings }
];

const navGroups = [
  { key: "normal", title: "Dashboard", base: ["/dashboard", "/user", "/profile"], items: normalNavItems },
  { key: "studio", title: "MrC. Studio", base: ["/studio", "/seller", "/instructor", "/consultant", "/freelancer"], items: studioNavItems },
  { key: "admin", title: "Admin dashboard", base: ["/admin"], items: adminNavItems }
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

function MobileBottomNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 grid border-t border-[hsl(var(--border))] bg-[hsl(var(--card))]/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 shadow-2xl shadow-black/10 backdrop-blur-xl lg:hidden"
      style={{ gridTemplateColumns: "repeat(5, minmax(0, 1fr))", width: "100vw" }}
    >
      {items.slice(0, 5).map((item) => {
        const exactOnly = ["/dashboard", "/seller", "/instructor", "/consultant", "/freelancer"].includes(item.href);
        const active = pathname === item.href || (!exactOnly && item.href !== "/" && pathname.startsWith(`${item.href}/`));
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={
              active
                ? "flex min-h-12 min-w-0 flex-col items-center justify-center gap-1 rounded-md bg-[hsl(var(--primary))]/10 px-1 text-[11px] font-black text-[hsl(var(--primary))]"
                : "flex min-h-12 min-w-0 flex-col items-center justify-center gap-1 rounded-md px-1 text-[11px] font-black text-[hsl(var(--muted-foreground))] transition-colors hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]"
            }
          >
            {Icon ? <Icon className="size-5 shrink-0" /> : null}
            <span className="max-w-full truncate">{item.label.split(" ")[0]}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function uniqueNavItems(items: NavItem[]) {
  const seen = new Set<string>();

  return items.filter((item) => {
    if (seen.has(item.href)) return false;
    seen.add(item.href);
    return true;
  });
}

function AccountProfileMenu({ user }: { user: Session["user"] }) {
  const isAdmin = user.role === "admin" || user.validatedRoles?.includes("admin");
  const initials = (user.name ?? user.email ?? "MC")
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const menuItems = [
    ...utilityNavItems,
    ...(isAdmin ? [{ href: "/admin/dashboard", label: "Admin", icon: ShieldCheck }] : [])
  ];

  return (
    <details className="group relative">
      <summary className="flex h-10 cursor-pointer list-none items-center gap-2 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-2 text-sm font-semibold text-[hsl(var(--foreground))] transition hover:bg-[hsl(var(--muted))] [&::-webkit-details-marker]:hidden">
        <span
          className="grid size-8 shrink-0 place-items-center overflow-hidden rounded-full bg-[hsl(var(--primary))]/15 text-xs font-black text-[hsl(var(--primary))]"
          style={user.image ? { backgroundImage: `url(${user.image})`, backgroundPosition: "center", backgroundSize: "cover" } : undefined}
          aria-hidden="true"
        >
          {user.image ? null : initials || <UserRound className="size-4" />}
        </span>
        <span className="hidden max-w-36 truncate sm:inline">{user.name ?? "Account"}</span>
        <ChevronDown className="size-4 text-[hsl(var(--muted-foreground))] transition group-open:rotate-180" />
      </summary>
      <div className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-2 shadow-xl">
        <div className="border-b border-[hsl(var(--border))] px-3 py-3">
          <p className="truncate text-sm font-black">{user.name ?? "MR Creativist"}</p>
          <p className="mt-1 truncate text-xs text-[hsl(var(--muted-foreground))]">{user.email}</p>
        </div>
        <div className="py-2">
          {menuItems.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold text-[hsl(var(--foreground))] transition hover:bg-[hsl(var(--muted))]"
              >
                {Icon ? <Icon className="size-4 text-[hsl(var(--primary))]" /> : null}
                {item.label}
              </Link>
            );
          })}
        </div>
        <div className="border-t border-[hsl(var(--border))] p-2">
          <div className="mb-2 flex items-center justify-between rounded-md px-3 py-2 text-sm font-semibold">
            <span>Theme</span>
            <ModeToggle />
          </div>
          <form action={logoutAction}>
            <Button type="submit" variant="outline" className="w-full justify-start">
              <LogOut className="size-4" />
              Log out
            </Button>
          </form>
        </div>
      </div>
    </details>
  );
}

export function DashboardShell({ children, user }: { children: React.ReactNode; user: Session["user"] }) {
  const pathname = usePathname();
  const workspaceGroup = getWorkspaceGroup(pathname);
  const sidebarGroups = [workspaceGroup];
  const mobileNavItems = uniqueNavItems(sidebarGroups.flatMap((group) => group.items));
  const bottomNavItems = workspaceGroup.items.slice(0, 5);

  return (
    <div className="min-h-screen bg-[hsl(var(--muted))]/25 pb-24 lg:pb-0">
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
            <ModeToggle />
            <AccountProfileMenu user={user} />
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
      <MobileBottomNav items={bottomNavItems} />
    </div>
  );
}
