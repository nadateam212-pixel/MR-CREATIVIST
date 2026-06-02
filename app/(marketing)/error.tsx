"use client";

import Link from "next/link";
import { AlertTriangle, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function MarketingError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-3xl flex-col items-center justify-center px-4 py-16 text-center text-[hsl(var(--foreground))]">
      <AlertTriangle className="mb-5 size-12 text-[hsl(var(--primary))]" />
      <h1 className="text-3xl font-black tracking-tight sm:text-5xl">MR Creativist is almost ready</h1>
      <p className="mt-4 max-w-xl text-sm leading-6 text-[hsl(var(--muted-foreground))]">
        The page could not finish loading. Refresh the browser or restart the dev server.
      </p>
      {error.message ? <p className="mt-4 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3 text-xs text-[hsl(var(--muted-foreground))]">{error.message}</p> : null}
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button type="button" onClick={reset}>
          <RefreshCcw className="size-4" />
          Try again
        </Button>
        <Button asChild variant="outline">
          <Link href="/">Go home</Link>
        </Button>
      </div>
    </div>
  );
}
