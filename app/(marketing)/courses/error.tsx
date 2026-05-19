"use client";

import { Button } from "@/components/ui/button";

export default function CoursesError({ reset }: { reset: () => void }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
      <h1 className="text-3xl font-semibold">Courses could not load</h1>
      <p className="mt-3 text-[hsl(var(--muted-foreground))]">Refresh the page and try again.</p>
      <Button className="mt-6" onClick={reset}>Retry</Button>
    </div>
  );
}
