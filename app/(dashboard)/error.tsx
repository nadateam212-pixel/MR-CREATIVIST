"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, Home, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ProtectedAreaError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="p-4 sm:p-6 xl:p-8">
      <Card className="mx-auto max-w-xl">
        <CardHeader>
          <div className="mb-3 flex size-11 items-center justify-center rounded-md bg-[hsl(var(--destructive))]/10 text-[hsl(var(--destructive))]">
            <AlertTriangle className="size-5" />
          </div>
          <CardTitle>Account page could not load</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <p className="text-sm leading-6 text-[hsl(var(--muted-foreground))]">
            Refresh the session or check deployment health. This usually points to an auth, database, or environment setting.
          </p>
          {error.digest ? (
            <p className="rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/40 px-3 py-2 text-xs text-[hsl(var(--muted-foreground))]">
              Error reference: {error.digest}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-3">
            <Button type="button" onClick={reset}>
              <RotateCcw className="size-4" />
              Retry
            </Button>
            <Button asChild variant="outline">
              <Link href="/api/health?deep=1">Deployment health</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/">
                <Home className="size-4" />
                Home
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
