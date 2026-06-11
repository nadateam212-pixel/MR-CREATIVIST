"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { Activity, Archive, CheckCircle2, Copy, Download, Edit3, Eye, FileCheck2, Settings, Share2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminWorkspaceConsole } from "@/components/admin/admin-workspace-console";

type WorkspaceRecord = {
  id: string;
  name: string;
  description?: string;
  status: string;
  kind?: string;
  tags?: string[];
  amount?: number;
  currency?: string;
  updatedAt: string;
};

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "") || "workspace";
}

function statusTone(status: string) {
  const normalized = status.toLowerCase();
  if (normalized.includes("ready") || normalized.includes("approved")) {
    return "border-[hsl(var(--primary))]/35 text-[hsl(var(--primary))]";
  }
  if (normalized.includes("review") || normalized.includes("progress") || normalized.includes("draft")) {
    return "border-amber-500/35 text-amber-500";
  }
  return "";
}

function statusLabel(status: string) {
  return status.replaceAll("_", " ");
}

export function WorkspacePage(props: {
  title: string;
  description: string;
  tags?: string[];
}) {
  const pathname = usePathname();

  if (pathname.startsWith("/admin")) {
    return <AdminWorkspaceConsole title={props.title} description={props.description} pathname={pathname} />;
  }

  return <StandardWorkspacePage {...props} pathname={pathname} />;
}

function StandardWorkspacePage({
  title,
  tags = [],
  pathname
}: {
  title: string;
  description: string;
  tags?: string[];
  pathname: string;
}) {
  const isAdmin = pathname.startsWith("/admin");
  const normalizedTags = useMemo(() => (tags.length > 0 ? tags : ["Records", "Approvals", "Exports", "Audit"]), [tags]);
  const [records, setRecords] = useState<WorkspaceRecord[]>([]);
  const [activity, setActivity] = useState("Loading live workspace records");
  const [busy, setBusy] = useState("");
  const [syncing, setSyncing] = useState(true);
  const [editingRecord, setEditingRecord] = useState<WorkspaceRecord | null>(null);
  const [editForm, setEditForm] = useState({ name: "", description: "", kind: "" });
  const resource = pathname.split("/").filter(Boolean).slice(1).join("-") || slugify(title);
  const actions = [
    { label: "Create", icon: Sparkles, method: "POST" },
    { label: "Manage", icon: Settings, method: "PATCH" },
    { label: "Review", icon: FileCheck2, method: "GET" },
    { label: "Export", icon: Download, method: "EXPORT" }
  ];

  useEffect(() => {
    const controller = new AbortController();

    async function syncWorkspace() {
      setSyncing(true);
      try {
        const params = new URLSearchParams({
          pathname,
          title,
          tags: normalizedTags.join(",")
        });
        const response = await fetch(`/api/workspace?${params.toString()}`, {
          cache: "no-store",
          signal: controller.signal
        });
        const payload = await response.json();

        if (response.ok) {
          setRecords(payload.records ?? []);
          setActivity(payload.activity ?? "Workspace synced");
        } else {
          setActivity(payload.error ?? "Workspace sync failed");
        }
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setActivity("Workspace sync failed. Check the server log.");
        }
      } finally {
        setSyncing(false);
      }
    }

    void syncWorkspace();

    return () => controller.abort();
  }, [normalizedTags, pathname, title]);

  async function runAction(label: string, method: string) {
    if (method === "EXPORT") {
      const payload = JSON.stringify({ module: title, pathname, records }, null, 2);
      const blob = new Blob([payload], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${slugify(title)}-export.json`;
      anchor.click();
      URL.revokeObjectURL(url);
      setActivity("Exported workspace records");
      toast.success("Workspace records exported.");
      return;
    }

    setBusy(label);
    try {
      const [adminResponse, workspaceResponse] = await Promise.all([
        isAdmin ? fetch(`/api/admin/${resource}`, { method, cache: "no-store" }).catch(() => null) : Promise.resolve(null),
        fetch("/api/workspace", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: label, method, pathname, title, tags: normalizedTags })
        })
      ]);
      const payload = await workspaceResponse.json();

      if (workspaceResponse.ok) {
        setRecords(payload.records ?? []);
        setActivity(payload.activity ?? `${label} recorded`);
        toast.success(`${label} completed.`);
      } else if (adminResponse) {
        const adminPayload = await adminResponse.json();
        setActivity(adminResponse.ok ? `${adminPayload.action ?? label} completed` : adminPayload.error ?? `${label} failed`);
        if (adminResponse.ok) {
          toast.success(`${label} completed.`);
        } else {
          toast.error(adminPayload.error ?? `${label} failed`);
        }
      } else {
        setActivity(payload.error ?? `${label} failed`);
        toast.error(payload.error ?? `${label} failed`);
      }
    } catch {
      setActivity(`${label} failed. Check the server log.`);
      toast.error(`${label} failed.`);
    } finally {
      setBusy("");
    }
  }

  function addRecord() {
    setBusy("Add record");
    fetch("/api/workspace", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "Create",
        pathname,
        title,
        tags: normalizedTags,
        name: `${title} record ${records.length + 1}`,
        description: `${title} record created from dashboard tools.`
      })
    })
      .then(async (response) => {
        const payload = await response.json();
        if (response.ok) {
          setRecords(payload.records ?? []);
          setActivity(payload.activity ?? "Record created");
          toast.success("Record added successfully.");
        } else {
          setActivity(payload.error ?? "Create failed");
          toast.error(payload.error ?? "Create failed");
        }
      })
      .catch(() => {
        setActivity("Create failed. Check the server log.");
        toast.error("Create failed.");
      })
      .finally(() => setBusy(""));
  }

  async function updateRecord(recordId: string, action: string) {
    setBusy(action);
    try {
      const response = await fetch("/api/workspace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, recordId, pathname, title, tags: normalizedTags })
      });
      const payload = await response.json();

      if (response.ok) {
        setRecords(payload.records ?? []);
        setActivity(payload.activity ?? `${action} recorded`);
        toast.success(`${action} completed.`);
      } else {
        setActivity(payload.error ?? `${action} failed`);
        toast.error(payload.error ?? `${action} failed`);
      }
    } catch {
      setActivity(`${action} failed. Check the server log.`);
      toast.error(`${action} failed.`);
    } finally {
      setBusy("");
    }
  }

  function viewRecord(record: WorkspaceRecord) {
    setActivity(`${record.name}: ${record.description ?? "No description saved."}`);
    toast.message(`${record.name} opened.`);
  }

  function startEditRecord(record: WorkspaceRecord) {
    setEditingRecord(record);
    setEditForm({
      name: record.name,
      description: record.description ?? "",
      kind: record.kind ?? "record"
    });
    setActivity(`Editing ${record.name}`);
  }

  async function saveEditRecord() {
    if (!editingRecord) return;

    setBusy("Edit");
    try {
      const response = await fetch("/api/workspace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "Edit",
          recordId: editingRecord.id,
          pathname,
          title,
          tags: normalizedTags,
          name: editForm.name,
          description: editForm.description,
          kind: editForm.kind
        })
      });
      const payload = await response.json();

      if (response.ok) {
        setRecords(payload.records ?? []);
        setEditingRecord(null);
        setActivity(payload.activity ?? "Record edited");
        toast.success("Record edited successfully.");
      } else {
        setActivity(payload.error ?? "Edit failed");
        toast.error(payload.error ?? "Edit failed");
      }
    } catch {
      setActivity("Edit failed. Check the server log.");
      toast.error("Edit failed.");
    } finally {
      setBusy("");
    }
  }

  function shareRecord(record: WorkspaceRecord) {
    const text = `${title} / ${record.name} / ${statusLabel(record.status)} / ${pathname}`;
    void navigator.clipboard?.writeText(text);
    setActivity("Record share summary copied");
    toast.success("Share summary copied.");
  }

  function duplicateRecord(record: WorkspaceRecord) {
    setBusy("Duplicate");
    fetch("/api/workspace", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "Create",
        pathname,
        title,
        tags: normalizedTags,
        name: `Copy of ${record.name}`,
        description: record.description ?? `${record.name} duplicated from records.`,
        kind: record.kind ?? "record",
        amount: record.amount ?? 0,
        currency: record.currency ?? "USD",
        metadata: { sourceRecordId: record.id }
      })
    })
      .then(async (response) => {
        const payload = await response.json();
        if (response.ok) {
          setRecords(payload.records ?? []);
          setActivity(payload.activity ?? "Record duplicated");
          toast.success("Record copied successfully.");
        } else {
          setActivity(payload.error ?? "Duplicate failed");
          toast.error(payload.error ?? "Duplicate failed");
        }
      })
      .catch(() => {
        setActivity("Duplicate failed. Check the server log.");
        toast.error("Duplicate failed.");
      })
      .finally(() => setBusy(""));
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <section className="flex flex-col gap-4 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap gap-2">
            {normalizedTags.map((tag) => (
              <Badge key={tag}>{tag}</Badge>
            ))}
          </div>
          <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">{title}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge className="h-10 px-3">
            <Activity className="mr-2 size-4" />
            {syncing ? "Syncing" : activity}
          </Badge>
          <Button type="button" onClick={addRecord}>
            <Sparkles className="size-4" />
            New record
          </Button>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {actions.map((action) => (
          <Button
            key={action.label}
            type="button"
            variant="outline"
            className="h-12 justify-start"
            onClick={() => void runAction(action.label, action.method)}
          >
            <action.icon className="size-4" />
            {busy === action.label ? "Running" : action.label}
          </Button>
        ))}
      </section>

      <section className="space-y-6">

        {editingRecord ? (
          <Card>
            <CardHeader>
              <CardTitle>Edit record</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-[1fr_1.5fr_12rem_auto]">
              <input
                value={editForm.name}
                onChange={(event) => setEditForm((current) => ({ ...current, name: event.target.value }))}
                className="h-10 rounded-md border border-[hsl(var(--border))] bg-transparent px-3 text-sm"
                placeholder="Record name"
              />
              <input
                value={editForm.description}
                onChange={(event) => setEditForm((current) => ({ ...current, description: event.target.value }))}
                className="h-10 rounded-md border border-[hsl(var(--border))] bg-transparent px-3 text-sm"
                placeholder="Description"
              />
              <input
                value={editForm.kind}
                onChange={(event) => setEditForm((current) => ({ ...current, kind: event.target.value }))}
                className="h-10 rounded-md border border-[hsl(var(--border))] bg-transparent px-3 text-sm"
                placeholder="Kind"
              />
              <div className="flex gap-2">
                <Button onClick={() => void saveEditRecord()} disabled={busy === "Edit"}>
                  <CheckCircle2 className="size-4" />
                  Save
                </Button>
                <Button variant="outline" onClick={() => setEditingRecord(null)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : null}

        <Card className="overflow-hidden">
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full min-w-[48rem] text-left text-sm">
              <thead className="border-b border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))]">
                <tr>
                  <th className="p-4 font-medium">Name</th>
                  <th className="p-4 font-medium">Kind</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium">Updated</th>
                  <th className="p-4 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[hsl(var(--border))]">
                {records.map((record) => (
                  <tr key={record.id}>
                    <td className="p-4">
                      <p className="font-semibold">{record.name}</p>
                      <p className="mt-1 max-w-xl truncate text-xs text-[hsl(var(--muted-foreground))]">{record.description ?? "Workspace record"}</p>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-2">
                        <Badge>{record.kind ?? "record"}</Badge>
                        {(record.tags ?? []).slice(0, 2).map((tag) => (
                          <Badge key={`${record.id}-${tag}`}>{tag}</Badge>
                        ))}
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge className={statusTone(record.status)}>{statusLabel(record.status)}</Badge>
                    </td>
                    <td className="p-4 text-[hsl(var(--muted-foreground))]">
                      {new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(record.updatedAt))}
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => viewRecord(record)}>
                          <Eye className="size-4" />
                          View
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => startEditRecord(record)}>
                          <Edit3 className="size-4" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => void updateRecord(record.id, "Approve")}
                        >
                          <CheckCircle2 className="size-4" />
                          Approve
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => duplicateRecord(record)}>
                          <Copy className="size-4" />
                          Copy
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => shareRecord(record)}>
                          <Share2 className="size-4" />
                          Share
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => void updateRecord(record.id, "Archive")}>
                          <Archive className="size-4" />
                          Archive
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
