"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, Home, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[hsl(var(--background))] p-6 text-[hsl(var(--foreground))]">
      <Card className="w-full max-w-xl">
        <CardHeader>
          <div className="mb-3 flex size-12 items-center justify-center rounded-md bg-[hsl(var(--destructive))]/10 text-[hsl(var(--destructive))]">
            <AlertTriangle className="size-6" />
          </div>
          <CardTitle>Something needs attention</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <p className="text-sm leading-6 text-[hsl(var(--muted-foreground))]">
            The page could not finish loading. Try again, or return home while the server checks are refreshed.
          </p>
          {error.digest ? (
            <p className="rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/40 px-3 py-2 text-xs text-[hsl(var(--muted-foreground))]">
              Error reference: {error.digest}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-3">
            <Button type="button" onClick={reset}>
              <RotateCcw className="size-4" />
              Try again
            </Button>
            <Button asChild variant="outline">
              <Link href="/">
                <Home className="size-4" />
                Back to Home
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
