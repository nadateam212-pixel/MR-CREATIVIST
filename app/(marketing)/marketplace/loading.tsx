import { Card, CardContent } from "@/components/ui/card";

export default function MarketplaceLoading() {
  return (
    <div className="app-frame card-grid-fill grid-catalog-products py-12">
      {Array.from({ length: 6 }).map((_, index) => (
        <Card key={index} className="overflow-hidden">
          <div className="aspect-[4/3] animate-pulse bg-[hsl(var(--muted))]" />
          <CardContent className="space-y-3 p-5">
            <div className="h-4 w-24 animate-pulse rounded bg-[hsl(var(--muted))]" />
            <div className="h-6 w-3/4 animate-pulse rounded bg-[hsl(var(--muted))]" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-[hsl(var(--muted))]" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
