"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Menu, User, X } from "lucide-react";
import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import { brand } from "@/lib/brand";
import { cn } from "@/lib/utils";
import { useI18n } from "@/hooks/use-i18n";

const navigation = [
  { key: "nav.courses", href: "/courses" },
  { key: "nav.marketplace", href: "/marketplace" },
  { key: "nav.consulting", href: "/consulting" },
  { key: "nav.freelancer", href: "/freelancers" }
];

export function MarketingHeader() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { t } = useI18n();

  return (
    <header className="sticky top-0 z-50 border-b border-[hsl(var(--border))] bg-[hsl(var(--background))]/96 text-[hsl(var(--foreground))] shadow-sm backdrop-blur-xl">
      <nav className="app-frame">
        <div className="flex h-20 items-center justify-between gap-5">
          <Link
            href="/"
            className="flex min-w-0 items-center gap-3"
            aria-label="Mr Creativist Home"
          >
            <span className="relative flex size-16 shrink-0 overflow-hidden rounded-md bg-white p-1 shadow-sm ring-1 ring-[hsl(var(--border))]">
              <Image
                src={brand.logo}
                alt={brand.name}
                fill
                sizes="64px"
                className="object-contain p-1"
                priority
              />
            </span>
            <span className="hidden whitespace-nowrap text-2xl font-black text-[hsl(var(--foreground))] sm:block">
              Mr Creativist
            </span>
          </Link>

          <div className="hidden flex-1 items-center justify-center gap-3 lg:flex">
            {navigation.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/" && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-md px-3 py-3 text-sm font-semibold transition-colors",
                    isActive
                      ? "bg-[hsl(var(--primary))]/12 text-[hsl(var(--primary))]"
                      : "text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]/70 hover:text-[hsl(var(--foreground))]"
                  )}
                >
                  {t(item.key)}
                </Link>
              );
            })}
          </div>

          <div className="hidden items-center gap-2 lg:flex">
            <Button
              asChild
              variant="outline"
              className="h-10 rounded-md border-[hsl(var(--border))] px-4 font-black text-[hsl(var(--foreground))]"
            >
              <Link href="/login">{t("auth.signIn")}</Link>
            </Button>
            <Button asChild className="h-10 rounded-md px-4 font-black">
              <Link href="/register">{t("auth.join")}</Link>
            </Button>
            <Button
              asChild
              variant="ghost"
              size="icon"
              className="text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]/70"
            >
              <Link href="/dashboard" aria-label={t("auth.dashboard")}>
                <LayoutDashboard className="size-5" />
              </Link>
            </Button>
            <Button
              asChild
              variant="ghost"
              size="icon"
              className="text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]/70"
            >
              <Link href="/profile" aria-label={t("auth.profile")}>
                <User className="size-5" />
              </Link>
            </Button>
            <ModeToggle className="border-transparent text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]/70" />
          </div>

          <button
            type="button"
            onClick={() => setIsOpen((current) => !current)}
            className="inline-flex size-10 items-center justify-center rounded-md border border-[hsl(var(--border))] text-[hsl(var(--foreground))] lg:hidden"
            aria-label="Toggle menu"
            aria-expanded={isOpen}
          >
            {isOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>

        {isOpen ? (
          <div className="grid gap-2 border-t border-[hsl(var(--border))] py-4 lg:hidden">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className="rounded-md px-3 py-3 text-sm font-bold text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]/70 hover:text-[hsl(var(--foreground))]"
              >
                {t(item.key)}
              </Link>
            ))}
            <div className="flex flex-wrap items-center gap-2 px-3 pt-2">
              <Button asChild variant="outline">
                <Link href="/login">{t("auth.signIn")}</Link>
              </Button>
              <Button asChild>
                <Link href="/register">{t("auth.join")}</Link>
              </Button>
              <Button asChild variant="ghost" size="icon">
                <Link href="/dashboard" aria-label={t("auth.dashboard")}>
                  <LayoutDashboard className="size-5" />
                </Link>
              </Button>
              <Button asChild variant="ghost" size="icon">
                <Link href="/profile" aria-label={t("auth.profile")}>
                  <User className="size-5" />
                </Link>
              </Button>
              <ModeToggle className="border-transparent text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]/70" />
            </div>
          </div>
        ) : null}
      </nav>
    </header>
  );
}
