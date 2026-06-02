"use client";

import { Banknote, Globe2 } from "lucide-react";
import { brand } from "@/lib/brand";
import { formatMoney } from "@/lib/currency";
import { cn } from "@/lib/utils";
import { useI18n } from "@/hooks/use-i18n";
import { saveUserPreferences, useUserPreferences } from "@/hooks/use-user-preferences";

export function LanguageCurrencySettings({ compact = false, dark = false }: { compact?: boolean; dark?: boolean }) {
  const settings = useUserPreferences();
  const { t } = useI18n();

  const selectClass = cn(
    "h-10 rounded-md border px-2 text-xs font-semibold uppercase tracking-wide outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]",
    dark
      ? "border-white/15 bg-white/10 text-white"
      : "border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))]",
    compact ? "w-[5.8rem]" : "w-[8.25rem]"
  );

  return (
    <div className={cn("grid gap-1.5", compact ? "gap-1" : "gap-1.5")}>
      <div className={cn("flex items-center gap-2", compact ? "gap-1.5" : "gap-2")}>
        <label className="sr-only" htmlFor="mr-creativist-language">
          {t("settings.language")}
        </label>
        <div className="relative">
          <Globe2 className="pointer-events-none absolute left-2 top-1/2 size-4 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
          <select
            id="mr-creativist-language"
            value={settings.language}
            onChange={(event) => saveUserPreferences({ language: event.target.value as typeof settings.language })}
            className={cn(selectClass, "pl-7")}
          >
            {brand.languages.map((language) => (
              <option key={language.code} value={language.code}>
                {compact ? language.code.toUpperCase() : language.label}
              </option>
            ))}
          </select>
        </div>

        <label className="sr-only" htmlFor="mr-creativist-currency">
          {t("settings.currency")}
        </label>
        <div className="relative">
          <Banknote className="pointer-events-none absolute left-2 top-1/2 size-4 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
          <select
            id="mr-creativist-currency"
            value={settings.currency}
            onChange={(event) => saveUserPreferences({ currency: event.target.value as typeof settings.currency })}
            className={cn(selectClass, "pl-7")}
          >
            {brand.currencies.map((currency) => (
              <option key={currency.code} value={currency.code}>
                {currency.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      {!compact ? (
        <p className={cn("text-[0.68rem] font-medium", dark ? "text-white/70" : "text-[hsl(var(--muted-foreground))]")}>
          1 USD = {formatMoney(settings.usdToFrw, "FRW")} - {settings.rateFallback ? t("settings.rateFallback") : t("settings.rateLive")}
        </p>
      ) : null}
    </div>
  );
}
