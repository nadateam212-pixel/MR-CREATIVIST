"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, CheckCircle2, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type NotificationRow = {
  id: string;
  title: string;
  body: string;
  type: string;
  readAt?: string;
  createdAt?: string;
  metadata?: {
    url?: string;
  };
};

function formatTime(value?: string) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export function NotificationCenter() {
  const [items, setItems] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const unreadCount = items.filter((item) => !item.readAt).length;

  useEffect(() => {
    let active = true;

    async function loadNotifications() {
      try {
        const response = await fetch("/api/notifications", { cache: "no-store" });
        const payload = await response.json();
        if (response.ok && active) setItems(payload.items ?? []);
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadNotifications();
    const interval = window.setInterval(loadNotifications, 30000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.18em] text-[hsl(var(--primary))]">Notifications</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">Latest activity</h1>
          <p className="mt-4 max-w-2xl text-[hsl(var(--muted-foreground))]">
            Messages, orders, courses, bookings and platform updates appear here, with Firebase push enabled when browser permission is granted.
          </p>
        </div>
        <Badge className="w-fit">
          <Bell className="mr-1 size-3" />
          {unreadCount} unread
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="size-5 text-[hsl(var(--primary))]" />
            Notification inbox
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))]">
              <Loader2 className="size-4 animate-spin" />
              Loading notifications
            </div>
          ) : null}
          {items.map((item) => (
            <div key={item.id} className="rounded-lg border border-[hsl(var(--border))] p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge>{item.type}</Badge>
                    {!item.readAt ? <Badge className="border-[hsl(var(--primary))]/35 text-[hsl(var(--primary))]">new</Badge> : null}
                    <span className="text-xs text-[hsl(var(--muted-foreground))]">{formatTime(item.createdAt)}</span>
                  </div>
                  <p className="mt-3 font-semibold">{item.title}</p>
                  <p className="mt-1 text-sm leading-6 text-[hsl(var(--muted-foreground))]">{item.body}</p>
                </div>
                {item.metadata?.url ? (
                  <Button asChild size="sm" variant="outline">
                    <Link href={item.metadata.url}>
                      <CheckCircle2 className="size-4" />
                      Open
                    </Link>
                  </Button>
                ) : null}
              </div>
            </div>
          ))}
          {!loading && !items.length ? (
            <div className="rounded-lg border border-dashed border-[hsl(var(--border))] p-8 text-center text-sm text-[hsl(var(--muted-foreground))]">
              No notifications yet. New messages and platform updates will appear here.
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
