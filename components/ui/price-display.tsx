"use client";

import { formatConvertedPrice, parseMoney } from "@/lib/currency";
import { cn } from "@/lib/utils";
import { useUserPreferences } from "@/hooks/use-user-preferences";

export function PriceDisplay({
  price,
  compareAt,
  className,
  compareAtClassName,
  targetCurrency
}: {
  price: string;
  compareAt?: string;
  className?: string;
  compareAtClassName?: string;
  targetCurrency?: "USD" | "FRW";
}) {
  const { currency, usdToFrw } = useUserPreferences();
  const displayCurrency = targetCurrency ?? currency;
  const compareAtAmount = compareAt ? parseMoney(compareAt)?.amount : 0;

  return (
    <div className="flex items-baseline gap-2">
      <span className={cn("text-lg font-semibold", className)}>{formatConvertedPrice(price, displayCurrency, usdToFrw)}</span>
      {compareAt && compareAtAmount && compareAtAmount > 0 ? (
        <span className={cn("text-sm text-[hsl(var(--muted-foreground))] line-through", compareAtClassName)}>
          {formatConvertedPrice(compareAt, displayCurrency, usdToFrw)}
        </span>
      ) : null}
    </div>
  );
}
