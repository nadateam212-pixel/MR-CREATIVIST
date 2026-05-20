import { USD_TO_FRW_RATE } from "@/lib/currency";
import { env, envNumber } from "@/lib/env";

const exchangeUrl = env("EXCHANGE_RATE_API_URL", "https://open.er-api.com/v6/latest/USD");

let cachedRate: {
  usdToFrw: number;
  provider: string;
  updatedAt?: string;
  nextUpdateAt?: string;
  fetchedAt: number;
  fallback: boolean;
} | null = null;

function fallbackRate() {
  return {
    base: "USD",
    quote: "FRW",
    usdToFrw: USD_TO_FRW_RATE,
    provider: "fallback",
    updatedAt: new Date().toISOString(),
    nextUpdateAt: "",
    fallback: true
  };
}

export async function GET() {
  const cacheMs = Math.max(60, envNumber("EXCHANGE_RATE_CACHE_SECONDS", 3600)) * 1000;

  if (cachedRate && Date.now() - cachedRate.fetchedAt < cacheMs) {
    return Response.json({
      base: "USD",
      quote: "FRW",
      usdToFrw: cachedRate.usdToFrw,
      provider: cachedRate.provider,
      updatedAt: cachedRate.updatedAt,
      nextUpdateAt: cachedRate.nextUpdateAt,
      fallback: cachedRate.fallback
    });
  }

  try {
    const response = await fetch(exchangeUrl, {
      cache: "no-store",
      headers: {
        Accept: "application/json"
      }
    });

    if (!response.ok) throw new Error(`Exchange provider returned ${response.status}.`);

    const payload = (await response.json()) as {
      result?: string;
      provider?: string;
      time_last_update_utc?: string;
      time_next_update_utc?: string;
      rates?: Record<string, number>;
    };
    const usdToFrw = Number(payload.rates?.RWF);

    if (payload.result && payload.result !== "success") throw new Error("Exchange provider did not return success.");
    if (!Number.isFinite(usdToFrw) || usdToFrw <= 0) throw new Error("RWF rate missing from exchange response.");

    cachedRate = {
      usdToFrw,
      provider: payload.provider || "open.er-api.com",
      updatedAt: payload.time_last_update_utc,
      nextUpdateAt: payload.time_next_update_utc,
      fetchedAt: Date.now(),
      fallback: false
    };

    return Response.json({
      base: "USD",
      quote: "FRW",
      usdToFrw: cachedRate.usdToFrw,
      provider: cachedRate.provider,
      updatedAt: cachedRate.updatedAt,
      nextUpdateAt: cachedRate.nextUpdateAt,
      fallback: false
    });
  } catch {
    return Response.json(fallbackRate(), {
      headers: {
        "Cache-Control": "no-store"
      }
    });
  }
}
