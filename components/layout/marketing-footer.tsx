"use client";

import Image from "next/image";
import Link from "next/link";
import { Mail, MapPin, Phone, Send, User } from "lucide-react";
import { LanguageCurrencySettings } from "@/components/layout/language-currency-settings";
import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import { brand } from "@/lib/brand";
import { useI18n } from "@/hooks/use-i18n";

const footerSections = [
  {
    titleKey: "footer.explore",
    links: [
      { labelKey: "nav.home", href: "/" },
      { labelKey: "nav.courses", href: "/courses" },
      { labelKey: "nav.marketplace", href: "/marketplace" },
      { labelKey: "nav.businesses", href: "/business-directory" },
      { labelKey: "nav.consulting", href: "/consulting" },
      { labelKey: "nav.freelancers", href: "/freelancers" },
      { labelKey: "nav.jobs", href: "/jobs" },
      { labelKey: "nav.aiTools", href: "/ai-tools" },
      { labelKey: "nav.about", href: "/about" }
    ]
  },
  {
    titleKey: "footer.grow",
    links: [
      { labelKey: "footer.instructors", href: "/instructors" },
      { labelKey: "footer.sellers", href: "/sellers" },
      { labelKey: "footer.affiliate", href: "/affiliate" },
      { labelKey: "footer.becomeInstructor", href: "/register" },
      { labelKey: "footer.startSelling", href: "/register" },
      { labelKey: "footer.businessDirectory", href: "/business-directory" },
      { labelKey: "footer.career", href: "/career-opportunities" },
      { labelKey: "footer.blog", href: "/blog" }
    ]
  },
  {
    titleKey: "footer.support",
    links: [
      { labelKey: "auth.dashboard", href: "/dashboard" },
      { labelKey: "auth.profile", href: "/profile" },
      { labelKey: "footer.cart", href: "/marketplace/cart" },
      { labelKey: "nav.support", href: "/support" },
      { labelKey: "footer.helpCenter", href: "/help-center" },
      { labelKey: "footer.search", href: "/search" },
      { labelKey: "footer.contact", href: "/contact" },
      { labelKey: "footer.faq", href: "/faq" }
    ]
  },
  {
    titleKey: "footer.legal",
    links: [
      { labelKey: "footer.terms", href: "/terms" },
      { labelKey: "footer.privacy", href: "/privacy" },
      { labelKey: "footer.refundPolicy", href: "/refund-policy" },
      { labelKey: "footer.pricing", href: "/pricing" },
      { labelKey: "auth.signIn", href: "/login" },
      { labelKey: "auth.join", href: "/register" }
    ]
  }
];

export function MarketingFooter() {
  const { t } = useI18n();

  return (
    <footer className="border-t border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--foreground))]">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.35fr_1.65fr]">
        <div>
          <div className="flex items-center gap-3">
            <span className="relative flex size-14 overflow-hidden rounded-md bg-white">
              <Image
                src={brand.logo}
                alt={brand.name}
                fill
                sizes="56px"
                className="object-contain p-2"
              />
            </span>
            <div>
              <p className="text-2xl font-black tracking-tight">{brand.shortName}</p>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-[hsl(var(--muted-foreground))]">{t("footer.tagline")}</p>
            </div>
          </div>
          <p className="mt-5 max-w-xl text-sm leading-7 text-[hsl(var(--muted-foreground))]">{t("footer.description")}</p>

          <div className="mt-6 grid gap-3 text-sm text-[hsl(var(--muted-foreground))]">
            <p className="flex items-center gap-3">
              <MapPin className="size-4 text-[hsl(var(--primary))]" />
              <span>{brand.address}</span>
            </p>
            <p className="flex items-start gap-3">
              <Phone className="mt-1 size-4 text-[hsl(var(--primary))]" />
              <span className="grid gap-1">
                {brand.phones.map((phone) => (
                  <a
                    key={phone}
                    href={`tel:${phone.replaceAll(" ", "")}`}
                    className="hover:text-[hsl(var(--foreground))]"
                  >
                    {phone}
                  </a>
                ))}
              </span>
            </p>
            <p className="flex items-center gap-3">
              <Mail className="size-4 text-[hsl(var(--primary))]" />
              <a href={`mailto:${brand.email}`} className="hover:text-[hsl(var(--foreground))]">
                {brand.email}
              </a>
            </p>
          </div>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-4">
          {footerSections.map((section) => (
            <div key={section.titleKey}>
              <p className="mb-4 text-sm font-black uppercase tracking-[0.18em] text-[hsl(var(--foreground))]">
                {t(section.titleKey)}
              </p>
              <div className="grid gap-3">
                {section.links.map((link) => (
                  <Link
                    key={`${section.titleKey}-${link.labelKey}-${link.href}`}
                    href={link.href}
                    className="text-sm font-semibold text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))]"
                  >
                    {t(link.labelKey)}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-[hsl(var(--border))]">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-6 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-3 sm:gap-5">
            <div className="flex flex-wrap gap-2">
              {Object.entries(brand.socials).map(([item, href]) => (
                <a
                  key={item}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-[hsl(var(--border))] px-4 py-2 text-xs font-black uppercase tracking-wide text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--primary))] hover:text-[hsl(var(--primary))]"
                >
                  {item}
                </a>
              ))}
            </div>
            <div className="hidden border-l border-[hsl(var(--border))] pl-5 sm:block">
              <LanguageCurrencySettings compact />
            </div>
          </div>

          <div className="flex flex-col gap-4 lg:items-end">
            <div className="flex flex-wrap items-center gap-2">
              <div className="sm:hidden">
                <LanguageCurrencySettings compact />
              </div>
              <Button
                asChild
                variant="outline"
                size="icon"
                className="border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]"
              >
                <Link href="/profile" aria-label={t("auth.profile")}>
                  <User className="size-4" />
                </Link>
              </Button>
              <ModeToggle className="border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]" />
            </div>
            <p className="flex items-center gap-2 text-xs font-semibold tracking-wide text-[hsl(var(--muted-foreground))]">
              <Send className="size-3.5" />
              {t("footer.copyright")}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
