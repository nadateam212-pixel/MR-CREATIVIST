"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Activity, Download, Eye, RefreshCw, Search, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type AdminMetric = {
  label: string;
  value: string;
  helper?: string;
};

type AdminWorkspaceRow = {
  id: string;
  resource: string;
  title: string;
  subtitle: string;
  kind: string;
  status: string;
  amount?: number;
  currency?: string;
  updatedAt?: string;
  details: Record<string, string>;
  actions: string[];
};

type AdminWorkspacePayload = {
  title: string;
  description: string;
  metrics: AdminMetric[];
  rows: AdminWorkspaceRow[];
  generatedAt: string;
};

function statusTone(status: string) {
  const normalized = status.toLowerCase();
  if (["active", "approved", "completed", "confirmed", "fulfilled", "paid", "published", "ready", "read"].includes(normalized)) {
    return "border-[hsl(var(--primary))]/35 text-[hsl(var(--primary))]";
  }
  if (["draft", "pending", "requested", "review", "submitted", "unread"].includes(normalized)) {
    return "border-amber-500/35 text-amber-600";
  }
  if (["archived", "cancelled", "failed", "refunded", "suspended", "unsubscribed"].includes(normalized)) {
    return "border-[hsl(var(--destructive))]/35 text-[hsl(var(--destructive))]";
  }

  return "";
}

function normalizeStatus(status: string) {
  return status.replaceAll("_", " ");
}

function formatDate(value?: string) {
  if (!value) return "Not recorded";
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function formatMoney(amount?: number, currency = "USD") {
  if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) return null;

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "FRW" ? 0 : 2
  }).format(amount);
}

export function AdminWorkspaceConsole({
  title,
  description,
  pathname
}: {
  title: string;
  description: string;
  pathname: string;
}) {
  const [payload, setPayload] = useState<AdminWorkspacePayload | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedRow, setSelectedRow] = useState<AdminWorkspaceRow | null>(null);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  const loadWorkspace = useCallback(async () => {
    setError("");
    try {
      const params = new URLSearchParams({ pathname, title, description });
      const response = await fetch(`/api/admin/workspace?${params.toString()}`, { cache: "no-store" });
      const nextPayload = await response.json();

      if (!response.ok) throw new Error(nextPayload.error ?? "Admin workspace unavailable.");

      setPayload(nextPayload);
      setSelectedRow((current) => {
        if (!current) return nextPayload.rows[0] ?? null;
        return nextPayload.rows.find((row: AdminWorkspaceRow) => row.id === current.id && row.resource === current.resource) ?? nextPayload.rows[0] ?? null;
      });
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : "Admin workspace unavailable.";
      setError(message);
      toast.error(message);
    }
  }, [description, pathname, title]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadWorkspace(), 0);

    return () => window.clearTimeout(timer);
  }, [loadWorkspace]);

  const statuses = useMemo(() => {
    return Array.from(new Set((payload?.rows ?? []).map((row) => row.status))).sort();
  }, [payload?.rows]);

  const visibleRows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return (payload?.rows ?? []).filter((row) => {
      const haystack = `${row.title} ${row.subtitle} ${row.kind} ${row.status} ${Object.values(row.details).join(" ")}`.toLowerCase();
      const matchesQuery = !normalizedQuery || haystack.includes(normalizedQuery);
      const matchesStatus = statusFilter === "all" || row.status === statusFilter;

      return matchesQuery && matchesStatus;
    });
  }, [payload?.rows, query, statusFilter]);

  function exportRows() {
    const blob = new Blob([JSON.stringify({ ...payload, rows: visibleRows }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${(payload?.title ?? title).toLowerCase().replace(/[^a-z0-9]+/g, "-")}-admin-export.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success("Admin data exported.");
  }

  async function runAction(row: AdminWorkspaceRow, action: string) {
    if (!window.confirm(`${action} ${row.title}?`)) return;

    setBusy(`${row.resource}:${row.id}:${action}`);
    try {
      const response = await fetch("/api/admin/workspace", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resource: row.resource, id: row.id, action })
      });
      const result = await response.json();

      if (!response.ok) throw new Error(result.error ?? `${action} failed.`);

      if (result.deleted) {
        setPayload((current) =>
          current ? { ...current, rows: current.rows.filter((item) => item.id !== row.id || item.resource !== row.resource) } : current
        );
        setSelectedRow((current) => (current?.id === row.id && current.resource === row.resource ? null : current));
      } else {
        setPayload((current) =>
          current
            ? {
                ...current,
                rows: current.rows.map((item) =>
                  item.id === row.id && item.resource === row.resource ? { ...item, status: result.status ?? item.status } : item
                )
              }
            : current
        );
        setSelectedRow((current) =>
          current?.id === row.id && current.resource === row.resource ? { ...current, status: result.status ?? current.status } : current
        );
      }

      toast.success(`${action} completed.`);
    } catch (actionError) {
      toast.error(actionError instanceof Error ? actionError.message : `${action} failed.`);
    } finally {
      setBusy("");
    }
  }

  const activeTitle = payload?.title ?? title;
  const activeDescription = payload?.description ?? description;

  return (
    <div className="content-frame space-y-6">
      <section className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[hsl(var(--primary))]/25 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-[hsl(var(--primary))]">
              <ShieldCheck className="size-3.5" />
              Live admin data
            </div>
            <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">{activeTitle}</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[hsl(var(--muted-foreground))] sm:text-base">
              {activeDescription}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => void loadWorkspace()}>
              <RefreshCw className="size-4" />
              Refresh
            </Button>
            <Button type="button" onClick={exportRows} disabled={!payload}>
              <Download className="size-4" />
              Export
            </Button>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {(payload?.metrics ?? [
            { label: "Loading", value: "...", helper: "Fetching live records" },
            { label: "Records", value: "...", helper: "Preparing admin rows" },
            { label: "Actions", value: "...", helper: "Mapping controls" },
            { label: "Status", value: "...", helper: "Checking database" }
          ]).map((metric) => (
            <div key={metric.label} className="rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-4">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-[hsl(var(--muted-foreground))]">{metric.label}</p>
              <p className="mt-2 text-2xl font-black">{metric.value}</p>
              {metric.helper ? <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">{metric.helper}</p> : null}
            </div>
          ))}
        </div>
      </section>

      {error ? (
        <div className="rounded-md border border-[hsl(var(--destructive))]/30 bg-[hsl(var(--destructive))]/5 p-4 text-sm text-[hsl(var(--destructive))]">
          {error}
        </div>
      ) : null}

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <Card className="overflow-hidden">
          <CardHeader>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-3">
                <Activity className="size-5 text-[hsl(var(--primary))]" />
                <CardTitle>Records</CardTitle>
              </div>
              <div className="grid gap-2 sm:grid-cols-[minmax(0,20rem)_12rem]">
                <label className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
                  <Input value={query} onChange={(event) => setQuery(event.target.value)} className="pl-9" placeholder="Search live records" />
                </label>
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="h-10 rounded-md border border-[hsl(var(--border))] bg-transparent px-3 text-sm"
                  aria-label="Filter by status"
                >
                  <option value="all">All statuses</option>
                  {statuses.map((status) => (
                    <option key={status} value={status}>
                      {normalizeStatus(status)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full min-w-[58rem] text-left text-sm">
              <thead className="border-y border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))]">
                <tr>
                  <th className="p-4 font-medium">Record</th>
                  <th className="p-4 font-medium">Type</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium">Updated</th>
                  <th className="p-4 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[hsl(var(--border))]">
                {visibleRows.length ? (
                  visibleRows.map((row) => {
                    const amount = formatMoney(row.amount, row.currency);

                    return (
                      <tr key={`${row.resource}:${row.id}`}>
                        <td className="p-4">
                          <p className="font-semibold">{row.title}</p>
                          <p className="mt-1 max-w-xl truncate text-xs text-[hsl(var(--muted-foreground))]">{row.subtitle}</p>
                          {amount ? <p className="mt-1 text-xs font-semibold text-[hsl(var(--primary))]">{amount}</p> : null}
                        </td>
                        <td className="p-4">
                          <Badge>{row.kind}</Badge>
                        </td>
                        <td className="p-4">
                          <Badge className={statusTone(row.status)}>{normalizeStatus(row.status)}</Badge>
                        </td>
                        <td className="p-4 text-[hsl(var(--muted-foreground))]">{formatDate(row.updatedAt)}</td>
                        <td className="p-4">
                          <div className="flex flex-wrap justify-end gap-2">
                            <Button size="sm" variant="outline" onClick={() => setSelectedRow(row)}>
                              <Eye className="size-4" />
                              View
                            </Button>
                            {row.actions.map((action) => (
                              <Button
                                key={`${row.resource}:${row.id}:${action}`}
                                size="sm"
                                variant="outline"
                                onClick={() => void runAction(row, action)}
                                disabled={busy === `${row.resource}:${row.id}:${action}`}
                              >
                                {busy === `${row.resource}:${row.id}:${action}` ? "Saving" : action}
                              </Button>
                            ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-sm text-[hsl(var(--muted-foreground))]">
                      {payload ? "No records match your filters." : "Loading records..."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card className="h-max">
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedRow ? (
              <div className="space-y-4">
                <div>
                  <div className="flex flex-wrap gap-2">
                    <Badge>{selectedRow.kind}</Badge>
                    <Badge className={statusTone(selectedRow.status)}>{normalizeStatus(selectedRow.status)}</Badge>
                  </div>
                  <h2 className="mt-3 text-xl font-black">{selectedRow.title}</h2>
                  <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">{selectedRow.subtitle}</p>
                </div>
                <div className="grid gap-3">
                  {Object.entries(selectedRow.details).map(([key, value]) => (
                    <div key={`${selectedRow.id}:${key}`} className="rounded-md border border-[hsl(var(--border))] p-3">
                      <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[hsl(var(--muted-foreground))]">
                        {key.replace(/([A-Z])/g, " $1")}
                      </p>
                      <p className="mt-1 break-words text-sm leading-6">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-[hsl(var(--muted-foreground))]">Select a record to inspect details inside the admin dashboard.</p>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
