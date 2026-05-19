"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function PageShell({
  eyebrow,
  title,
  description,
  children
}: {
  eyebrow?: string;
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6">
      <div className="max-w-3xl">
        {eyebrow ? <p className="text-sm font-medium text-[hsl(var(--primary))]">{eyebrow}</p> : null}
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-5xl">{title}</h1>
        <p className="mt-4 text-lg leading-8 text-[hsl(var(--muted-foreground))]">{description}</p>
      </div>
      <div className="mt-8">{children}</div>
    </div>
  );
}

export function FeatureGrid({ items }: { items: { title: string; body: string; icon?: React.ComponentType<{ className?: string }> }[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <Card key={item.title}>
          <CardHeader>
            {item.icon ? <item.icon className="mb-2 size-5 text-[hsl(var(--primary))]" /> : null}
            <CardTitle>{item.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-6 text-[hsl(var(--muted-foreground))]">{item.body}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
