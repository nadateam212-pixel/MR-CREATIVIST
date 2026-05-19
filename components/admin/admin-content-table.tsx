"use client";

import { useState } from "react";
import Link from "next/link";
import { Archive, CheckCircle2, Edit3, ExternalLink, Share2, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export type AdminContentField = {
  key: string;
  label: string;
  value?: string;
  options?: string[];
};

export type AdminContentRow = {
  id: string;
  title: string;
  subtitle?: string;
  kind?: string;
  status: string;
  href?: string;
  apiPath?: string;
  updateMethod?: "PATCH" | "PUT";
  editFields?: AdminContentField[];
};

function statusTone(status: string) {
  const normalized = status.toLowerCase();
  if (["published", "approved", "active", "completed"].includes(normalized)) {
    return "border-[hsl(var(--primary))]/35 text-[hsl(var(--primary))]";
  }
  if (["draft", "pending", "review", "needs_more_info"].includes(normalized)) {
    return "border-amber-500/35 text-amber-500";
  }
  if (["archived", "closed", "rejected", "suspended"].includes(normalized)) {
    return "border-[hsl(var(--destructive))]/35 text-[hsl(var(--destructive))]";
  }

  return "";
}

function normalizeStatus(status: string) {
  return status.replaceAll("_", " ");
}

export function AdminContentTable({
  title,
  rows: initialRows,
  emptyMessage = "No records found."
}: {
  title: string;
  rows: AdminContentRow[];
  emptyMessage?: string;
}) {
  const [rows, setRows] = useState(initialRows);
  const [editingId, setEditingId] = useState("");
  const [editForm, setEditForm] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState("");

  const editingRow = rows.find((row) => row.id === editingId);

  function startEdit(row: AdminContentRow) {
    const fields = row.editFields?.length
      ? row.editFields
      : [
          { key: "title", label: "Title", value: row.title },
          { key: "status", label: "Status", value: row.status, options: ["draft", "published", "archived"] }
        ];

    setEditingId(row.id);
    setEditForm(Object.fromEntries(fields.map((field) => [field.key, field.value ?? ""])));
  }

  function updateLocalRow(row: AdminContentRow, patch: Record<string, string>) {
    const nextTitle = patch.title ?? patch.name ?? row.title;
    const nextSubtitle = patch.category ?? patch.role ?? row.subtitle;
    const nextStatus = patch.status ?? row.status;

    setRows((current) =>
      current.map((item) =>
        item.id === row.id
          ? {
              ...item,
              title: nextTitle,
              subtitle: nextSubtitle,
              status: nextStatus,
              editFields: item.editFields?.map((field) => ({ ...field, value: patch[field.key] ?? field.value }))
            }
          : item
      )
    );
  }

  async function saveEdit() {
    if (!editingRow?.apiPath) return;

    setBusy("edit");
    try {
      const response = await fetch(editingRow.apiPath, {
        method: editingRow.updateMethod ?? "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm)
      });
      const payload = await response.json();

      if (!response.ok) throw new Error(payload.error ?? "Update failed.");

      const item = payload.item ?? payload;
      updateLocalRow(editingRow, {
        ...editForm,
        title: item.title ?? editForm.title,
        name: item.name ?? editForm.name,
        category: item.category ?? editForm.category,
        role: item.role ?? editForm.role,
        status: item.status ?? editForm.status
      });
      setEditingId("");
      toast.success("Record updated successfully.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Update failed.");
    } finally {
      setBusy("");
    }
  }

  async function updateStatus(row: AdminContentRow, status: string) {
    if (!row.apiPath) return;

    setBusy(`${row.id}:${status}`);
    try {
      const response = await fetch(row.apiPath, {
        method: row.updateMethod ?? "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      const payload = await response.json();

      if (!response.ok) throw new Error(payload.error ?? "Status update failed.");

      const item = payload.item ?? payload;
      updateLocalRow(row, { status: item.status ?? status });
      toast.success(`${normalizeStatus(status)} saved.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Status update failed.");
    } finally {
      setBusy("");
    }
  }

  async function archiveRow(row: AdminContentRow) {
    if (!row.apiPath || !window.confirm(`Archive ${row.title}?`)) return;

    setBusy(`${row.id}:archive`);
    try {
      const response = await fetch(row.apiPath, { method: "DELETE" });
      const payload = await response.json();

      if (!response.ok) throw new Error(payload.error ?? "Archive failed.");

      const item = payload.item ?? {};
      updateLocalRow(row, { status: item.status ?? "archived" });
      toast.success("Record archived successfully.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Archive failed.");
    } finally {
      setBusy("");
    }
  }

  function shareRow(row: AdminContentRow) {
    const text = `${row.title} - ${row.href ?? row.apiPath ?? ""}`;
    void navigator.clipboard?.writeText(text);
    toast.success("Share summary copied.");
  }

  return (
    <div className="space-y-5">
      {editingRow ? (
        <Card>
          <CardHeader>
            <CardTitle>Edit {editingRow.title}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-[repeat(3,minmax(0,1fr))_auto]">
            {(editingRow.editFields ?? []).map((field) =>
              field.options?.length ? (
                <select
                  key={field.key}
                  value={editForm[field.key] ?? ""}
                  onChange={(event) => setEditForm((current) => ({ ...current, [field.key]: event.target.value }))}
                  className="h-10 rounded-md border border-[hsl(var(--border))] bg-transparent px-3 text-sm"
                  aria-label={field.label}
                >
                  {field.options.map((option) => (
                    <option key={option} value={option}>
                      {normalizeStatus(option)}
                    </option>
                  ))}
                </select>
              ) : (
                <Input
                  key={field.key}
                  value={editForm[field.key] ?? ""}
                  onChange={(event) => setEditForm((current) => ({ ...current, [field.key]: event.target.value }))}
                  placeholder={field.label}
                />
              )
            )}
            <div className="flex gap-2">
              <Button onClick={() => void saveEdit()} disabled={busy === "edit"}>
                <CheckCircle2 className="size-4" />
                Save
              </Button>
              <Button variant="outline" onClick={() => setEditingId("")}>
                <X className="size-4" />
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[64rem] text-left text-sm">
            <thead className="border-y border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))]">
              <tr>
                <th className="p-4 font-medium">Record</th>
                <th className="p-4 font-medium">Kind</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[hsl(var(--border))]">
              {rows.length ? (
                rows.map((row) => (
                  <tr key={row.id}>
                    <td className="p-4">
                      <p className="font-semibold">{row.title}</p>
                      {row.subtitle ? <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">{row.subtitle}</p> : null}
                    </td>
                    <td className="p-4">
                      <Badge>{row.kind ?? "record"}</Badge>
                    </td>
                    <td className="p-4">
                      <Badge className={statusTone(row.status)}>{normalizeStatus(row.status)}</Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap justify-end gap-2">
                        {row.href ? (
                          <Button asChild size="sm" variant="outline">
                            <Link href={row.href} target="_blank">
                              <ExternalLink className="size-4" />
                              View
                            </Link>
                          </Button>
                        ) : null}
                        {row.apiPath ? (
                          <Button size="sm" variant="outline" onClick={() => startEdit(row)}>
                            <Edit3 className="size-4" />
                            Edit
                          </Button>
                        ) : null}
                        {row.apiPath && row.status !== "published" ? (
                          <Button size="sm" variant="outline" onClick={() => void updateStatus(row, "published")} disabled={busy === `${row.id}:published`}>
                            <CheckCircle2 className="size-4" />
                            Publish
                          </Button>
                        ) : null}
                        <Button size="sm" variant="outline" onClick={() => shareRow(row)}>
                          <Share2 className="size-4" />
                          Share
                        </Button>
                        {row.apiPath ? (
                          <Button size="sm" variant="outline" onClick={() => void archiveRow(row)} disabled={busy === `${row.id}:archive`}>
                            {row.status === "archived" ? <Archive className="size-4" /> : <Trash2 className="size-4" />}
                            Archive
                          </Button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-sm text-[hsl(var(--muted-foreground))]">
                    {emptyMessage}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
