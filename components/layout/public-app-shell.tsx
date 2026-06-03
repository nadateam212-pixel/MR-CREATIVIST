"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Bell,
  Bot,
  BriefcaseBusiness,
  Building2,
  ChevronDown,
  Clock3,
  GraduationCap,
  Headphones,
  Home,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Newspaper,
  Search,
  Settings,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  User,
  Users
} from "lucide-react";
import { logoutAction } from "@/app/(dashboard)/actions";
import { LanguageCurrencySettings } from "@/components/layout/language-currency-settings";
import { MarketingFooter } from "@/components/layout/marketing-footer";
import { ModeToggle } from "@/components/mode-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/hooks/use-i18n";
import { usePlatformStore } from "@/hooks/use-platform-store";
import { brand } from "@/lib/brand";
import { cn } from "@/lib/utils";

const tools = [
  { href: "/", labelKey: "nav.home", fallback: "Home", icon: Home },
  { href: "/courses", labelKey: "nav.courses", fallback: "Courses", icon: GraduationCap },
  { href: "/freelancers", labelKey: "nav.freelancers", fallback: "Freelancers", icon: Users },
  { href: "/marketplace", labelKey: "nav.marketplace", fallback: "Marketplace", icon: ShoppingBag },
  { href: "/business-directory", labelKey: "nav.businesses", fallback: "Businesses", icon: Building2 },
  { href: "/jobs", labelKey: "nav.jobs", fallback: "Jobs", icon: BriefcaseBusiness },
  { href: "/blog", labelKey: "nav.blogs", fallback: "Blogs", icon: Newspaper },
  { href: "/ai-tools", labelKey: "nav.aiTools", fallback: "AI Tools", icon: Bot },
  { href: "/messages", labelKey: "nav.messages", fallback: "Messages", icon: MessageSquare },
  { href: "/support", labelKey: "nav.support", fallback: "Support", icon: Headphones },
  { href: "/settings", labelKey: "nav.settings", fallback: "Settings", icon: Settings }
];

const activityItems = [
  "New job published for AI Workflow Specialist",
  "Business profile updated with new services",
  "Course certificate verified",
  "Product inquiry moved to messages",
  "MrCreativist.AI generation completed"
];

const mobileNavItems = [
  { href: "/", labelKey: "nav.home", fallback: "Home", icon: Home },
  { href: "/courses", labelKey: "nav.courses", fallback: "Courses", icon: GraduationCap },
  { href: "/marketplace", labelKey: "nav.marketplace", fallback: "Marketplace", icon: ShoppingBag },
  { href: "/ai-tools", labelKey: "nav.aiTools", fallback: "AI Tools", icon: Bot },
  { href: "/settings", labelKey: "nav.settings", fallback: "Settings", icon: Settings }
];

const mobileNavLabels: Record<string, string> = {
  "/": "Home",
  "/courses": "Courses",
  "/marketplace": "Market",
  "/ai-tools": "AI",
  "/settings": "Settings"
};

function initials(value?: string | null) {
  return (value ?? "MC")
    .split(" ")
    .map((item) => item[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function MobileBottomNav() {
  const pathname = usePathname();
  const { t } = useI18n();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 grid border-t border-[hsl(var(--border))] bg-[hsl(var(--card))]/95 px-1 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 shadow-2xl shadow-black/10 backdrop-blur-xl lg:hidden"
      style={{ gridTemplateColumns: "repeat(5, minmax(0, 1fr))" }}
    >
      {mobileNavItems.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex min-h-12 min-w-0 flex-col items-center justify-center gap-1 rounded-md px-1 text-[10px] font-black leading-none transition-colors",
              active
                ? "bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))]"
                : "text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]"
            )}
          >
            <Icon className="size-5 shrink-0" />
            <span className="max-w-full truncate">{mobileNavLabels[item.href] ?? t(item.labelKey, item.fallback).split(" ")[0]}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function PublicAppShell({
  children
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const user = session?.user;
  const { t } = useI18n();
  const cartCount = usePlatformStore((state) => state.cartCount);
  const [profileOpen, setProfileOpen] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);

  return (
    <div className="public-theme-shell min-h-screen overflow-x-hidden bg-[hsl(var(--background))] pb-20 text-[hsl(var(--foreground))] lg:pb-0">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-[hsl(var(--border))] bg-[hsl(var(--card))] lg:block">
        <div className="flex h-full flex-col">
          <Link href="/" className="flex items-center gap-3 px-5 py-7" aria-label={`${brand.name} home`}>
            <span
              className="relative flex size-16 shrink-0 overflow-hidden rounded-md bg-white p-1 shadow-lg"
              style={{ boxShadow: "0 16px 45px hsl(var(--primary) / 0.1)" }}
            >
              <Image src={brand.logo} alt={brand.name} fill sizes="64px" className="object-contain p-1" priority />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-lg font-black uppercase tracking-wide">MR CREATIVIST</span>
              <span className="mt-1 block text-[0.65rem] font-bold uppercase tracking-[0.22em] text-[hsl(var(--muted-foreground))]">Create. Learn. Sell.</span>
            </span>
          </Link>

          <nav className="flex-1 overflow-y-auto px-3 pb-4">
            <div className="grid gap-1">
              {tools.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    style={active ? { background: "var(--gradient-primary)", boxShadow: "0 14px 32px hsl(var(--primary) / 0.22)", color: "#fff" } : undefined}
                    className={cn(
                      "flex h-11 items-center gap-3 rounded-md px-3 text-sm font-semibold transition-colors",
                      active
                        ? "text-white"
                        : "text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]"
                    )}
                  >
                    <Icon className="size-5" />
                    {t(item.labelKey, item.fallback)}
                  </Link>
                );
              })}
            </div>

            <div className="mt-5 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/40 p-3">
              <p className="mb-3 text-xs font-black uppercase tracking-[0.16em] text-[hsl(var(--muted-foreground))]">
                {t("settings.languageCurrency")}
              </p>
              <LanguageCurrencySettings compact />
            </div>
          </nav>

          <div className="border-t border-[hsl(var(--border))] p-4">
            <Button
              asChild
              variant="outline"
              className="w-full border-[hsl(var(--primary))]/35 bg-[hsl(var(--primary))]/10 text-[hsl(var(--foreground))] hover:bg-[hsl(var(--primary))]/20"
            >
              <Link href="/profile">
                <Sparkles className="size-4" />
                {t("nav.createProfile")}
              </Link>
            </Button>
          </div>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-[hsl(var(--border))] bg-[hsl(var(--background))]/90 px-4 py-3 backdrop-blur-xl sm:px-6">
          <div className="mx-auto flex max-w-7xl items-center gap-3">
            <Link href="/" className="relative flex size-11 shrink-0 overflow-hidden rounded-md bg-white p-1 lg:hidden">
              <Image src={brand.logo} alt={brand.name} fill sizes="44px" className="object-contain p-1" />
            </Link>

            <form action="/search" className="relative min-w-0 flex-1">
              <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
              <input
                name="q"
                placeholder={t("common.searchPlatform")}
                className="h-11 w-full rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--card))] pl-12 pr-4 text-sm text-[hsl(var(--foreground))] outline-none placeholder:text-[hsl(var(--muted-foreground))] focus:border-[hsl(var(--primary))]"
              />
            </form>

            <div className="flex shrink-0 items-center gap-1 sm:gap-2">
              <Button
                asChild
                size="icon"
                variant="outline"
                className="relative border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]"
              >
                <Link href="/marketplace/cart" aria-label="Shopping cart">
                  <ShoppingCart className="size-4" />
                  {cartCount ? (
                    <span className="absolute -right-2 -top-2 flex min-w-5 items-center justify-center rounded-full bg-[hsl(var(--primary))] px-1 text-[0.65rem] font-black text-[hsl(var(--primary-foreground))]">
                      {cartCount > 99 ? "99+" : cartCount}
                    </span>
                  ) : null}
                </Link>
              </Button>
              <Button
                asChild
                size="icon"
                variant="outline"
                className="border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]"
              >
                <Link href="/messages" aria-label="Messages">
                  <MessageSquare className="size-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="icon"
                variant="outline"
                className="border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]"
              >
                <Link href="/notifications" aria-label="Notifications">
                  <Bell className="size-4" />
                </Link>
              </Button>
              <ModeToggle className="hidden border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] sm:inline-flex" />

              {user ? (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setProfileOpen((current) => !current)}
                    className="flex h-11 items-center gap-2 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-2 text-left hover:bg-[hsl(var(--muted))]"
                  >
                    <span className="relative flex size-8 items-center justify-center overflow-hidden rounded-full bg-[hsl(var(--primary))] text-xs font-black text-[hsl(var(--primary-foreground))]">
                      {user.image ? <Image src={user.image} alt={user.name ?? "Profile"} fill sizes="32px" className="object-cover" /> : initials(user.name)}
                    </span>
                    <span className="hidden max-w-28 truncate text-sm font-semibold sm:block">{user.name ?? "Profile"}</span>
                    <ChevronDown className="hidden size-4 text-[hsl(var(--muted-foreground))] sm:block" />
                  </button>

                  {profileOpen ? (
                    <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-2 shadow-2xl shadow-black/15">
                      {[
                        { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
                        { href: "/studio", label: "MrC. Studio", icon: Bot },
                        { href: "/profile", label: "Profile", icon: User },
                        { href: "/messages", label: "Messages", icon: MessageSquare },
                        { href: "/notifications", label: "Notifications", icon: Bell },
                        { href: "/settings", label: "Settings", icon: Settings }
                      ].map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]"
                        >
                          <item.icon className="size-4" />
                          {item.label}
                        </Link>
                      ))}
                      <form action={logoutAction} className="mt-1 border-t border-[hsl(var(--border))] pt-1">
                        <button type="submit" className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-red-300 hover:bg-red-500/10">
                          <LogOut className="size-4" />
                          Logout
                        </button>
                      </form>
                    </div>
                  ) : null}
                </div>
              ) : (
                <Button asChild>
                  <Link href="/login">Sign in</Link>
                </Button>
              )}
            </div>
          </div>
        </header>

        <div className="hidden border-b border-[hsl(var(--border))] px-4 py-2 lg:hidden">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {tools.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="shrink-0 rounded-md border border-[hsl(var(--border))] px-3 py-2 text-xs font-bold text-[hsl(var(--foreground))]"
              >
                {t(item.labelKey, item.fallback)}
              </Link>
            ))}
          </div>
        </div>

        <main>{children}</main>
        <div className="hidden lg:block">
          <MarketingFooter />
        </div>
      </div>

      <MobileBottomNav />

      <div className="fixed bottom-24 right-5 z-50 hidden lg:block lg:bottom-5">
        {activityOpen ? (
          <div className="mb-3 w-80 max-w-[calc(100vw-2.5rem)] rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 text-[hsl(var(--foreground))] shadow-2xl shadow-black/15">
            <div className="mb-3 flex items-center justify-between">
              <p className="font-black uppercase tracking-wide">{t("common.liveActivity")}</p>
              <Badge className="border-[hsl(var(--primary))] text-[hsl(var(--primary))]">{t("common.recent")}</Badge>
            </div>
            <div className="grid gap-2">
              {activityItems.map((item, index) => (
                <div
                  key={item}
                  className="flex gap-3 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/35 p-3 text-sm text-[hsl(var(--muted-foreground))]"
                >
                  <Clock3 className="mt-0.5 size-4 shrink-0 text-[hsl(var(--primary))]" />
                  <span>{item}</span>
                  <span className="ml-auto shrink-0 text-xs text-[hsl(var(--muted-foreground))]">{index + 2}m</span>
                </div>
              ))}
            </div>
          </div>
        ) : null}
        <button
          type="button"
          onClick={() => setActivityOpen((current) => !current)}
          className="flex size-14 items-center justify-center rounded-full text-white"
          style={{ background: "var(--gradient-primary)", boxShadow: "0 22px 55px hsl(var(--primary) / 0.25)" }}
          aria-label="Live activity"
        >
          <Sparkles className="size-6" />
        </button>
      </div>
    </div>
  );
}
