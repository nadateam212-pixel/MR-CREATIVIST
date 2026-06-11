const skeletonCards = Array.from({ length: 6 }, (_, index) => index);

export default function MarketingLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6">
      <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
        <div className="h-12 animate-pulse rounded-md bg-[hsl(var(--muted))]" />
        <div className="h-12 w-full animate-pulse rounded-md bg-[hsl(var(--muted))] lg:w-36" />
      </div>
      <div className="mt-5 flex gap-2 overflow-hidden">
        {skeletonCards.slice(0, 5).map((item) => (
          <div key={item} className="h-10 w-28 shrink-0 animate-pulse rounded-md bg-[hsl(var(--muted))]" />
        ))}
      </div>
      <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {skeletonCards.map((item) => (
          <div key={item} className="overflow-hidden rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--card))]">
            <div className="aspect-[4/3] animate-pulse bg-[hsl(var(--muted))]" />
            <div className="space-y-3 p-4">
              <div className="h-4 w-2/3 animate-pulse rounded bg-[hsl(var(--muted))]" />
              <div className="h-3 w-1/2 animate-pulse rounded bg-[hsl(var(--muted))]" />
              <div className="h-8 w-24 animate-pulse rounded bg-[hsl(var(--muted))]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
