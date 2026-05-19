"use client";

import { useState } from "react";
import Link from "next/link";
import { Archive, CheckCircle2, ExternalLink, MessageSquare, Share2, ShieldOff, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type AdminPersonRow = {
  id: string;
  userId?: string;
  name: string;
  email?: string;
  role: string;
  title?: string;
  status: "active" | "review" | "suspended" | "draft" | "published" | "archived";
  metric?: string;
  href?: string;
  publicHref?: string;
  archivePath?: string;
};

function statusTone(status: string) {
  if (status === "active" || status === "published") return "border-[hsl(var(--primary))]/35 text-[hsl(var(--primary))]";
  if (status === "review" || status === "draft") return "border-amber-500/35 text-amber-500";
  return "border-[hsl(var(--destructive))]/35 text-[hsl(var(--destructive))]";
}

export function AdminPeopleManager({
  title,
  rows: initialRows,
  emptyMessage = "No people found."
}: {
  title: string;
  rows: AdminPersonRow[];
  emptyMessage?: string;
}) {
  const [rows, setRows] = useState(initialRows);
  const [busy, setBusy] = useState("");

  function updateRow(id: string, patch: Partial<AdminPersonRow>) {
    setRows((current) => current.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  }

  async function setAccountStatus(row: AdminPersonRow, accountStatus: "active" | "suspended" | "review") {
    if (!row.userId) return;

    setBusy(`${row.id}:${accountStatus}`);
    try {
      const response = await fetch(`/api/admin/users/${row.userId}/roles`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountStatus })
      });
      const payload = await response.json();

      if (!response.ok) throw new Error(payload.error ?? "User update failed.");

      updateRow(row.id, { status: payload.user?.accountStatus ?? accountStatus });
      toast.success(accountStatus === "suspended" ? "User blocked successfully." : "User activated successfully.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "User update failed.");
    } finally {
      setBusy("");
    }
  }

  async function archiveProfile(row: AdminPersonRow) {
    if (!row.archivePath || !window.confirm(`Archive ${row.name}?`)) return;

    setBusy(`${row.id}:archive`);
    try {
      const response = await fetch(row.archivePath, { method: "DELETE" });
      const payload = await response.json();

      if (!response.ok) throw new Error(payload.error ?? "Archive failed.");

      updateRow(row.id, { status: "archived" });
      toast.success("Profile archived successfully.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Archive failed.");
    } finally {
      setBusy("");
    }
  }

  function sharePerson(row: AdminPersonRow) {
    const text = `${row.name} - ${row.title ?? row.role} - ${row.publicHref ?? row.href ?? ""}`;
    void navigator.clipboard?.writeText(text);
    toast.success("Share summary copied.");
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto p-0">
        <table className="w-full min-w-[64rem] text-left text-sm">
          <thead className="border-y border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))]">
            <tr>
              <th className="p-4 font-medium">Person</th>
              <th className="p-4 font-medium">Role</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium">Metric</th>
              <th className="p-4 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[hsl(var(--border))]">
            {rows.length ? (
              rows.map((row) => (
                <tr key={row.id}>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <span className="grid size-10 place-items-center rounded-md bg-[hsl(var(--muted))]">
                        <UserRound className="size-5 text-[hsl(var(--primary))]" />
                      </span>
                      <div>
                        <p className="font-semibold">{row.name}</p>
                        <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">{row.email ?? row.title ?? "No email recorded"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <Badge>{row.role}</Badge>
                  </td>
                  <td className="p-4">
                    <Badge className={statusTone(row.status)}>{row.status}</Badge>
                  </td>
                  <td className="p-4 text-[hsl(var(--muted-foreground))]">{row.metric ?? "Ready"}</td>
                  <td className="p-4">
                    <div className="flex flex-wrap justify-end gap-2">
                      {row.href ? (
                        <Button asChild size="sm" variant="outline">
                          <Link href={row.href}>
                            <ExternalLink className="size-4" />
                            Edit
                          </Link>
                        </Button>
                      ) : null}
                      {row.publicHref ? (
                        <Button asChild size="sm" variant="outline">
                          <Link href={row.publicHref} target="_blank">
                            <ExternalLink className="size-4" />
                            View
                          </Link>
                        </Button>
                      ) : null}
                      {row.userId ? (
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/messages/${row.userId}`}>
                            <MessageSquare className="size-4" />
                            Message
                          </Link>
                        </Button>
                      ) : null}
                      {row.userId ? (
                        row.status === "suspended" ? (
                          <Button size="sm" variant="outline" onClick={() => void setAccountStatus(row, "active")} disabled={busy === `${row.id}:active`}>
                            <CheckCircle2 className="size-4" />
                            Activate
                          </Button>
                        ) : (
                          <Button size="sm" variant="outline" onClick={() => void setAccountStatus(row, "suspended")} disabled={busy === `${row.id}:suspended`}>
                            <ShieldOff className="size-4" />
                            Block
                          </Button>
                        )
                      ) : null}
                      <Button size="sm" variant="outline" onClick={() => sharePerson(row)}>
                        <Share2 className="size-4" />
                        Share
                      </Button>
                      {row.archivePath ? (
                        <Button size="sm" variant="outline" onClick={() => void archiveProfile(row)} disabled={busy === `${row.id}:archive`}>
                          <Archive className="size-4" />
                          Archive
                        </Button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="p-8 text-center text-sm text-[hsl(var(--muted-foreground))]">
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
