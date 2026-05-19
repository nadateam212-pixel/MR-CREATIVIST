"use client";

import { formatConvertedPrice } from "@/lib/currency";
import { cn } from "@/lib/utils";
import { useUserPreferences } from "@/hooks/use-user-preferences";

export function PriceDisplay({
  price,
  compareAt,
  className,
  compareAtClassName
}: {
  price: string;
  compareAt?: string;
  className?: string;
  compareAtClassName?: string;
}) {
  const { currency, usdToFrw } = useUserPreferences();

  return (
    <div className="flex items-baseline gap-2">
      <span className={cn("text-lg font-semibold", className)}>{formatConvertedPrice(price, currency, usdToFrw)}</span>
      {compareAt ? (
        <span className={cn("text-sm text-[hsl(var(--muted-foreground))] line-through", compareAtClassName)}>
          {formatConvertedPrice(compareAt, currency, usdToFrw)}
        </span>
      ) : null}
    </div>
  );
}
