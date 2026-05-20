"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Card>
      <CardHeader>
        <div className="mb-3 flex size-11 items-center justify-center rounded-md bg-[hsl(var(--destructive))]/10 text-[hsl(var(--destructive))]">
          <AlertTriangle className="size-5" />
        </div>
        <CardTitle>Dashboard could not load</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <p className="text-sm leading-6 text-[hsl(var(--muted-foreground))]">
          Your account is signed in, but the dashboard data did not finish loading. Retry now or check deployment health.
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
            <Link href="/api/health">Deployment health</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
