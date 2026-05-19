"use client";

import { useUserPreferences } from "@/hooks/use-user-preferences";
import { formatConvertedPrice } from "@/lib/currency";

export function LocalizedPrice({ value, className }: { value: string; className?: string }) {
  const { currency, usdToFrw } = useUserPreferences();

  return <span className={className}>{formatConvertedPrice(value, currency, usdToFrw)}</span>;
}
