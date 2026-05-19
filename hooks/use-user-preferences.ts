"use client";

import { useEffect, useState } from "react";
import { USD_TO_FRW_RATE, defaultCurrencyForVisitor, type SupportedCurrency } from "@/lib/currency";
import { defaultLanguage, normalizeLanguage, type SupportedLanguage } from "@/lib/i18n";

export type UserPreferences = {
  language: SupportedLanguage;
  currency: SupportedCurrency;
  usdToFrw: number;
  rateUpdatedAt?: string;
  rateFallback: boolean;
};

const settingsEventName = "mr-creativist-settings-change";

let cachedRate: Pick<UserPreferences, "usdToFrw" | "rateUpdatedAt" | "rateFallback"> | null = null;
let rateRequest: Promise<Pick<UserPreferences, "usdToFrw" | "rateUpdatedAt" | "rateFallback">> | null = null;

function normalizeCurrency(value?: string | null): SupportedCurrency {
  return value === "USD" || value === "FRW" ? value : defaultCurrencyForVisitor();
}

export function readUserPreferences(): UserPreferences {
  if (typeof window === "undefined") {
    return {
      language: defaultLanguage,
      currency: "FRW",
      usdToFrw: USD_TO_FRW_RATE,
      rateFallback: true
    };
  }

  return {
    language: normalizeLanguage(window.localStorage.getItem("mr-creativist-language")),
    currency: normalizeCurrency(window.localStorage.getItem("mr-creativist-currency")),
    usdToFrw: cachedRate?.usdToFrw ?? USD_TO_FRW_RATE,
    rateUpdatedAt: cachedRate?.rateUpdatedAt,
    rateFallback: cachedRate?.rateFallback ?? true
  };
}

function defaultUserPreferences(): UserPreferences {
  return {
    language: defaultLanguage,
    currency: "FRW",
    usdToFrw: USD_TO_FRW_RATE,
    rateFallback: true
  };
}

export function saveUserPreferences(next: Partial<Pick<UserPreferences, "language" | "currency">>) {
  if (typeof window === "undefined") return;

  const current = readUserPreferences();
  const merged = {
    language: next.language ?? current.language,
    currency: next.currency ?? current.currency
  };

  window.localStorage.setItem("mr-creativist-language", merged.language);
  window.localStorage.setItem("mr-creativist-currency", merged.currency);
  window.dispatchEvent(new CustomEvent(settingsEventName, { detail: merged }));
}

async function fetchExchangeRate() {
  if (cachedRate && !cachedRate.rateFallback) return cachedRate;
  if (rateRequest) return rateRequest;

  rateRequest = fetch("/api/exchange-rate", { cache: "no-store" })
    .then(async (response) => {
      if (!response.ok) throw new Error("Exchange rate unavailable.");
      const payload = (await response.json()) as {
        usdToFrw?: number;
        updatedAt?: string;
        fallback?: boolean;
      };
      const usdToFrw = Number(payload.usdToFrw);

      cachedRate = {
        usdToFrw: Number.isFinite(usdToFrw) && usdToFrw > 0 ? usdToFrw : USD_TO_FRW_RATE,
        rateUpdatedAt: payload.updatedAt,
        rateFallback: Boolean(payload.fallback)
      };

      return cachedRate;
    })
    .catch(() => {
      cachedRate = {
        usdToFrw: USD_TO_FRW_RATE,
        rateFallback: true
      };
      return cachedRate;
    })
    .finally(() => {
      rateRequest = null;
    });

  return rateRequest;
}

export function useUserPreferences() {
  const [preferences, setPreferences] = useState<UserPreferences>(() => defaultUserPreferences());

  useEffect(() => {
    function syncPreferences() {
      setPreferences(readUserPreferences());
    }

    syncPreferences();
    window.addEventListener("storage", syncPreferences);
    window.addEventListener(settingsEventName, syncPreferences);

    return () => {
      window.removeEventListener("storage", syncPreferences);
      window.removeEventListener(settingsEventName, syncPreferences);
    };
  }, []);

  useEffect(() => {
    let active = true;

    fetchExchangeRate().then((rate) => {
      if (!active) return;
      setPreferences((current) => ({
        ...current,
        ...rate
      }));
    });

    return () => {
      active = false;
    };
  }, []);

  return preferences;
}
