import { envNumber } from "@/lib/env";

export type SupportedCurrency = "USD" | "FRW";

const fallbackUsdToFrw = 1463;

export const USD_TO_FRW_RATE =
  envNumber("NEXT_PUBLIC_USD_TO_FRW_RATE", fallbackUsdToFrw) > 0
    ? envNumber("NEXT_PUBLIC_USD_TO_FRW_RATE", fallbackUsdToFrw)
    : fallbackUsdToFrw;

export function defaultCurrencyForVisitor(): SupportedCurrency {
  if (typeof window === "undefined") return "FRW";

  const locale = navigator.language.toLowerCase();
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  return locale.endsWith("-rw") || timeZone === "Africa/Kigali" ? "FRW" : "USD";
}

function normalizeCurrency(value?: string | null): SupportedCurrency {
  return value === "USD" || value === "FRW" ? value : defaultCurrencyForVisitor();
}

export function readPreferredCurrency(): SupportedCurrency {
  if (typeof window === "undefined") return "FRW";
  return normalizeCurrency(window.localStorage.getItem("mr-creativist-currency"));
}

export function parseMoney(value: string): { amount: number; currency: SupportedCurrency } | null {
  const normalized = value.trim();
  if (!normalized) return null;

  const amount = Number(normalized.replace(/,/g, "").match(/-?\d+(\.\d+)?/)?.[0] ?? "");
  if (!Number.isFinite(amount)) return null;

  const upper = normalized.toUpperCase();
  const currency: SupportedCurrency = upper.includes("FRW") || upper.includes("RWF") ? "FRW" : "USD";

  return { amount, currency };
}

export function convertMoney(amount: number, from: SupportedCurrency, to: SupportedCurrency, usdToFrw = USD_TO_FRW_RATE) {
  if (from === to) return amount;
  return from === "USD" ? amount * usdToFrw : amount / usdToFrw;
}

export function formatMoney(amount: number, currency: SupportedCurrency) {
  if (currency === "FRW") {
    return `FRW ${new Intl.NumberFormat("en-US", {
      maximumFractionDigits: 0
    }).format(Math.round(amount))}`;
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2
  }).format(amount);
}

export function formatConvertedPrice(value: string, targetCurrency: SupportedCurrency, usdToFrw = USD_TO_FRW_RATE) {
  const parsed = parseMoney(value);
  if (!parsed) return value;
  if (parsed.amount <= 0) return "Free";

  const converted = convertMoney(parsed.amount, parsed.currency, targetCurrency, usdToFrw);
  return formatMoney(converted, targetCurrency);
}

export function isFreePrice(value: string) {
  const parsed = parseMoney(value);
  return Boolean(parsed && parsed.amount <= 0);
}

export function formatConvertedAmount(
  amount: number,
  fromCurrency: SupportedCurrency,
  targetCurrency: SupportedCurrency,
  usdToFrw = USD_TO_FRW_RATE
) {
  return formatMoney(convertMoney(amount, fromCurrency, targetCurrency, usdToFrw), targetCurrency);
}
