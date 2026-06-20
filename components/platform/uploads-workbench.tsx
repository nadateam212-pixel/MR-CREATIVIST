"use client";

/* eslint-disable @next/next/no-img-element */

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Copy, ExternalLink, FileText, Loader2, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export type UploadAssetView = {
  id: string;
  fileName: string;
  url: string;
  secureUrl?: string;
  playbackUrl?: string;
  embedUrl?: string;
  thumbnailUrl?: string;
  provider?: string;
  kind: "image" | "video" | "audio" | "document" | "archive" | "other";
  ownerType?: string;
  status?: string;
  sizeBytes?: number;
  createdAt?: string;
};

function formatBytes(value?: number) {
  const bytes = Number(value ?? 0);
  if (bytes <= 0) return "0 KB";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toFixed(index ? 1 : 0)} ${units[index]}`;
}

function assetUrl(asset: UploadAssetView) {
  return asset.secureUrl || asset.playbackUrl || asset.embedUrl || asset.url;
}

export function UploadsWorkbench({ initialAssets = [] }: { initialAssets?: UploadAssetView[] }) {
  const [assets, setAssets] = useState(initialAssets);
  const [kind, setKind] = useState<UploadAssetView["kind"]>("document");
  const [ownerType, setOwnerType] = useState("course");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState("");
  const [status, setStatus] = useState("");

  async function refreshAssets() {
    const response = await fetch("/api/upload", { cache: "no-store" });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error ?? "Uploads could not refresh.");
    setAssets(payload.items ?? []);
  }

  async function submitUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) {
      setStatus("Choose a file before uploading.");
      toast.error("Choose a file before uploading.");
      return;
    }

    setBusy("upload");
    setStatus("Uploading asset...");

    try {
      const data = new FormData();
      data.set("file", file);
      data.set("kind", kind);
      data.set("ownerType", ownerType);
      data.set("metadata", JSON.stringify({ module: "studio-uploads" }));

      const response = await fetch("/api/upload", { method: "POST", body: data });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Upload failed.");

      const asset = payload.asset;
      setAssets((current) => [{ ...asset, id: String(asset.id ?? asset._id) }, ...current]);
      setFile(null);
      setStatus(payload.degraded ? "Uploaded locally while database/provider is degraded." : "Upload saved.");
      toast.success("Upload saved.");
    } catch (error) {
      const nextStatus = error instanceof Error ? error.message : "Upload failed.";
      setStatus(nextStatus);
      toast.error(nextStatus);
    } finally {
      setBusy("");
    }
  }

  async function deleteAsset(assetId: string) {
    setBusy(assetId);
    try {
      const response = await fetch(`/api/uploads/${assetId}`, { method: "DELETE" });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error ?? "Delete failed.");

      setAssets((current) => current.filter((asset) => asset.id !== assetId));
      setStatus("Upload deleted.");
      toast.success("Upload deleted.");
    } catch (error) {
      const nextStatus = error instanceof Error ? error.message : "Delete failed.";
      setStatus(nextStatus);
      toast.error(nextStatus);
    } finally {
      setBusy("");
    }
  }

  async function copyAsset(asset: UploadAssetView) {
    await navigator.clipboard?.writeText(assetUrl(asset));
    setStatus("Asset link copied.");
    toast.success("Asset link copied.");
  }

  return (
    <div className="content-frame space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Uploads</h1>
        </div>
        <Button type="button" variant="outline" onClick={() => void refreshAssets()}>
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload asset</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3 lg:grid-cols-[1fr_12rem_12rem_auto]" onSubmit={submitUpload}>
            <Input type="file" required onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
            <select value={kind} onChange={(event) => setKind(event.target.value as UploadAssetView["kind"])} required className="h-10 rounded-md border border-[hsl(var(--border))] bg-transparent px-3 text-sm">
              {["image", "video", "audio", "document", "archive", "other"].map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <select value={ownerType} onChange={(event) => setOwnerType(event.target.value)} required className="h-10 rounded-md border border-[hsl(var(--border))] bg-transparent px-3 text-sm">
              {["course", "product", "assignment", "project", "profile", "message", "general"].map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <Button type="submit" disabled={busy === "upload"}>
              {busy === "upload" ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
              {busy === "upload" ? "Uploading..." : "Upload"}
            </Button>
          </form>
          {status ? <p className="mt-3 text-sm text-[hsl(var(--muted-foreground))]">{status}</p> : null}
        </CardContent>
      </Card>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {assets.map((asset) => (
          <Card key={asset.id} className="overflow-hidden">
            <div className="grid aspect-video place-items-center overflow-hidden bg-[hsl(var(--muted))]/50">
              {asset.kind === "image" ? (
                <img src={assetUrl(asset)} alt={asset.fileName} className="h-full w-full object-cover" />
              ) : asset.thumbnailUrl ? (
                <img src={asset.thumbnailUrl} alt={asset.fileName} className="h-full w-full object-cover" />
              ) : (
                <FileText className="size-10 text-[hsl(var(--primary))]" />
              )}
            </div>
            <CardContent className="space-y-4 p-4">
              <div className="min-w-0">
                <div className="flex flex-wrap gap-2">
                  <Badge>{asset.kind}</Badge>
                  <Badge>{asset.status ?? "ready"}</Badge>
                  {asset.provider ? <Badge>{asset.provider}</Badge> : null}
                </div>
                <h2 className="mt-3 truncate font-semibold">{asset.fileName}</h2>
                <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
                  {formatBytes(asset.sizeBytes)} {asset.ownerType ? `- ${asset.ownerType}` : ""}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button asChild size="sm" variant="outline">
                  <Link href={assetUrl(asset)} target="_blank">
                    <ExternalLink className="size-4" />
                    Open
                  </Link>
                </Button>
                <Button size="sm" variant="outline" onClick={() => void copyAsset(asset)}>
                  <Copy className="size-4" />
                  Copy
                </Button>
                <Button size="sm" variant="outline" onClick={() => void deleteAsset(asset.id)} disabled={busy === asset.id}>
                  {busy === asset.id ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {!assets.length ? (
          <Card className="md:col-span-2 xl:col-span-3">
            <CardContent className="p-8 text-center text-sm text-[hsl(var(--muted-foreground))]">
              No uploads yet. Add course videos, product images, documents, templates, or support files here.
            </CardContent>
          </Card>
        ) : null}
      </section>
    </div>
  );
}
