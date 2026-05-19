import { Star } from "lucide-react";

export function RatingStars({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-1" aria-label={`${value} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          className={index < Math.round(value) ? "size-4 fill-[hsl(var(--secondary))] text-[hsl(var(--secondary))]" : "size-4 text-[hsl(var(--border))]"}
        />
      ))}
      <span className="ml-1 text-sm text-[hsl(var(--muted-foreground))]">{value.toFixed(1)}</span>
    </div>
  );
}
