"use client";

/* eslint-disable @next/next/no-img-element */

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Archive, Eye, Loader2, Plus, Save, Send, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type ProductEditorRecord = {
  id: string;
  name: string;
  slug: string;
  type: string;
  description: string;
  sellerName: string;
  price: number;
  compareAtPrice?: number;
  currency: "USD" | "FRW";
  images: string[];
  category: string;
  location?: string;
  stock: number;
  delivery: string;
  tools: string[];
  tags: string[];
  status: string;
};

const productTypes = ["Digital", "Physical", "Template", "Download", "Software", "Creator assets", "Service"];
const statuses = ["draft", "submitted", "changes_requested", "approved", "published", "archived"];

function splitLines(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function ProductEditor({ product }: { product: ProductEditorRecord }) {
  const [images, setImages] = useState<string[]>(product.images?.filter(Boolean) ?? []);
  const [form, setForm] = useState({
    name: product.name,
    type: product.type || "Digital",
    category: product.category,
    description: product.description,
    price: String(product.price ?? 0),
    compareAtPrice: product.compareAtPrice ? String(product.compareAtPrice) : "",
    currency: product.currency,
    location: product.location ?? "Kigali, Rwanda",
    stock: String(product.stock ?? 0),
    delivery: product.delivery,
    tools: (product.tools ?? []).join("\n"),
    tags: (product.tags ?? []).join(", "),
    status: product.status || "draft"
  });
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");

  function update(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function uploadImage(file?: File | null) {
    if (!file) return;
    setBusy("upload");
    setMessage("Uploading product image...");

    try {
      const data = new FormData();
      data.set("file", file);
      data.set("kind", "image");
      data.set("ownerType", "product");
      data.set("ownerId", product.id);
      data.set("metadata", JSON.stringify({ module: "product-editor" }));

      const response = await fetch("/api/upload", { method: "POST", body: data });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Image upload failed.");

      const imageUrl = payload.asset?.secureUrl ?? payload.asset?.url;
      if (!imageUrl) throw new Error("Upload did not return an image URL.");

      setImages((current) => [...current, imageUrl]);
      setMessage("Image added to the gallery. Save the product to keep it.");
      toast.success("Image uploaded.");
    } catch (error) {
      const nextMessage = error instanceof Error ? error.message : "Image upload failed.";
      setMessage(nextMessage);
      toast.error(nextMessage);
    } finally {
      setBusy("");
    }
  }

  async function saveProduct(nextStatus = form.status, successMessage = "Product saved.") {
    const missing = [
      ["Product name", form.name],
      ["Category", form.category],
      ["Description", form.description],
      ["Price", form.price],
      ["Delivery", form.delivery],
      ["Image", images[0]]
    ]
      .filter(([, value]) => !String(value ?? "").trim())
      .map(([label]) => label);

    if (missing.length) {
      const nextMessage = `Missing required fields: ${missing.join(", ")}.`;
      setMessage(nextMessage);
      toast.error(nextMessage);
      return;
    }

    setBusy(nextStatus);
    setMessage("Saving product...");

    try {
      const response = await fetch(`/api/products/${encodeURIComponent(product.id || product.slug)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          type: form.type,
          category: form.category,
          description: form.description,
          price: Number(form.price) || 0,
          compareAtPrice: form.compareAtPrice ? Number(form.compareAtPrice) || 0 : undefined,
          currency: form.currency,
          images,
          location: form.location,
          stock: Number(form.stock) || 0,
          delivery: form.delivery,
          tools: splitLines(form.tools),
          tags: form.tags
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
          status: nextStatus
        })
      });
      const payload = await response.json();
      if (!response.ok || payload.error) throw new Error(payload.error ?? "Product save failed.");

      setMessage(successMessage);
      setForm((current) => ({ ...current, status: payload.status ?? nextStatus }));
      toast.success(successMessage);
    } catch (error) {
      const nextMessage = error instanceof Error ? error.message : "Product save failed.";
      setMessage(nextMessage);
      toast.error(nextMessage);
    } finally {
      setBusy("");
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void saveProduct(form.status);
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Badge>{form.status.replaceAll("_", " ")}</Badge>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">Edit product</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href={`/marketplace/product/${product.slug}`}>
              <Eye className="size-4" />
              View listing
            </Link>
          </Button>
          <Button variant="outline" onClick={() => void saveProduct("archived", "Product archived.")} disabled={Boolean(busy)}>
            <Archive className="size-4" />
            Archive
          </Button>
        </div>
      </div>

      <section className="grid gap-5 lg:grid-cols-[1fr_24rem]">
        <Card>
          <CardHeader>
            <CardTitle>Listing details</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4 md:grid-cols-2" onSubmit={submit}>
              <label className="grid gap-2 text-sm font-semibold">
                Product name
                <Input value={form.name} onChange={(event) => update("name", event.target.value)} required minLength={3} />
              </label>
              <label className="grid gap-2 text-sm font-semibold">
                Category
                <Input value={form.category} onChange={(event) => update("category", event.target.value)} required minLength={2} />
              </label>
              <label className="grid gap-2 text-sm font-semibold">
                Type
                <select value={form.type} onChange={(event) => update("type", event.target.value)} required className="h-10 rounded-md border border-[hsl(var(--border))] bg-transparent px-3">
                  {productTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2 text-sm font-semibold">
                Status
                <select value={form.status} onChange={(event) => update("status", event.target.value)} required className="h-10 rounded-md border border-[hsl(var(--border))] bg-transparent px-3">
                  {statuses.map((status) => (
                    <option key={status} value={status}>
                      {status.replaceAll("_", " ")}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2 text-sm font-semibold md:col-span-2">
                Description
                <textarea value={form.description} onChange={(event) => update("description", event.target.value)} required minLength={20} className="min-h-36 rounded-md border border-[hsl(var(--border))] bg-transparent p-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]" />
              </label>
              <label className="grid gap-2 text-sm font-semibold">
                Price
                <Input value={form.price} onChange={(event) => update("price", event.target.value)} inputMode="decimal" required />
              </label>
              <label className="grid gap-2 text-sm font-semibold">
                Compare price
                <Input value={form.compareAtPrice} onChange={(event) => update("compareAtPrice", event.target.value)} inputMode="decimal" />
              </label>
              <label className="grid gap-2 text-sm font-semibold">
                Stock
                <Input value={form.stock} onChange={(event) => update("stock", event.target.value)} inputMode="numeric" required />
              </label>
              <label className="grid gap-2 text-sm font-semibold">
                Delivery
                <Input value={form.delivery} onChange={(event) => update("delivery", event.target.value)} required minLength={2} />
              </label>
              <label className="grid gap-2 text-sm font-semibold md:col-span-2">
                Product location
                <Input value={form.location} onChange={(event) => update("location", event.target.value)} required minLength={2} placeholder="Kigali, Rwanda" />
              </label>
              <label className="grid gap-2 text-sm font-semibold md:col-span-2">
                Included tools
                <textarea value={form.tools} onChange={(event) => update("tools", event.target.value)} className="min-h-28 rounded-md border border-[hsl(var(--border))] bg-transparent p-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]" />
              </label>
              <label className="grid gap-2 text-sm font-semibold md:col-span-2">
                Tags
                <Input value={form.tags} onChange={(event) => update("tags", event.target.value)} placeholder="templates, creator, business" />
              </label>
              <div className="flex flex-wrap items-center gap-2 md:col-span-2">
                <Button type="submit" disabled={Boolean(busy)}>
                  {busy && !["submitted", "draft", "archived"].includes(busy) ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                  {busy && !["submitted", "draft", "archived"].includes(busy) ? "Saving..." : "Save changes"}
                </Button>
                <Button type="button" variant="outline" onClick={() => void saveProduct("submitted", "Product submitted for review.")} disabled={Boolean(busy)}>
                  {busy === "submitted" ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                  {busy === "submitted" ? "Submitting..." : "Submit for review"}
                </Button>
                <Button type="button" variant="outline" onClick={() => void saveProduct("draft", "Product saved as draft.")} disabled={Boolean(busy)}>
                  {busy === "draft" ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                  {busy === "draft" ? "Saving..." : "Save draft"}
                </Button>
                {message ? <p className="text-sm text-[hsl(var(--muted-foreground))]">{message}</p> : null}
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="h-max">
          <CardHeader>
            <CardTitle>Image and preview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="overflow-hidden rounded-md border border-[hsl(var(--border))]">
              {images[0] ? <img src={images[0]} alt={form.name} className="aspect-[4/3] w-full object-cover" /> : <div className="grid aspect-[4/3] place-items-center text-sm text-[hsl(var(--muted-foreground))]">Add a cover image</div>}
            </div>
            <Button asChild variant="outline" className="w-full">
              <label className="cursor-pointer">
                {busy === "upload" ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
                {busy === "upload" ? "Uploading..." : "Add gallery image"}
                <input type="file" accept="image/*" multiple className="sr-only" onChange={(event) => Array.from(event.target.files ?? []).forEach((file) => void uploadImage(file))} />
              </label>
            </Button>
            <div className="grid grid-cols-3 gap-2">
              {images.map((image, index) => <div key={`${image}-${index}`} className="group relative overflow-hidden rounded-md border border-[hsl(var(--border))]"><img src={image} alt="" className="aspect-square w-full object-cover" /><button type="button" onClick={() => setImages((current) => current.filter((_, itemIndex) => itemIndex !== index))} className="absolute right-1 top-1 grid size-7 place-items-center rounded-md bg-black/70 text-white" aria-label={`Remove image ${index + 1}`}><Trash2 className="size-3.5" /></button>{index === 0 ? <span className="absolute bottom-1 left-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-bold text-white">Cover</span> : null}</div>)}
              <label className="grid aspect-square cursor-pointer place-items-center rounded-md border border-dashed border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))]"><Plus className="size-5" /><input type="file" accept="image/*" className="sr-only" onChange={(event) => void uploadImage(event.target.files?.[0])} /></label>
            </div>
            <div className="rounded-md border border-[hsl(var(--border))] p-4">
              <Badge>{form.type}</Badge>
              <h2 className="mt-3 text-xl font-semibold">{form.name || "Product name"}</h2>
              <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
                FRW {Number(form.price || 0).toLocaleString()} - {form.location || "Kigali, Rwanda"} - {form.stock || 0} in stock
              </p>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
