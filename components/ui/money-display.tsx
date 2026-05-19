"use client";

import { formatConvertedAmount, type SupportedCurrency } from "@/lib/currency";
import { cn } from "@/lib/utils";
import { useUserPreferences } from "@/hooks/use-user-preferences";

export function MoneyDisplay({
  amount,
  currency = "USD",
  className
}: {
  amount: number;
  currency?: SupportedCurrency;
  className?: string;
}) {
  const preferences = useUserPreferences();

  return (
    <span className={cn(className)}>
      {formatConvertedAmount(amount, currency, preferences.currency, preferences.usdToFrw)}
    </span>
  );
}
