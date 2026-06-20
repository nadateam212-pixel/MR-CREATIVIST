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
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="app-frame py-6">
      <div className="max-w-3xl">
        {eyebrow ? <p className="text-xs font-black uppercase tracking-[0.16em] text-[hsl(var(--primary))]">{eyebrow}</p> : null}
        <h1 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">{title}</h1>
        {description ? <p className="mt-3 text-sm leading-6 text-[hsl(var(--muted-foreground))]">{description}</p> : null}
      </div>
      <div className="mt-5">{children}</div>
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
