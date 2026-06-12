"use client";

/* eslint-disable @next/next/no-img-element */

import { useMemo, useState } from "react";
import Link from "next/link";
import { BriefcaseBusiness, Edit3, Eye, ImagePlus, Save, Send, Share2, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const defaultGigImage = "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=1200&q=85";
type StudioCurrency = "USD" | "FRW";

type StudioGig = {
  id?: string;
  title: string;
  slug: string;
  category: string;
  packageName: string;
  description: string;
  price: string;
  currency?: "USD" | "FRW" | string;
  deliveryDays: number;
  revisions: number;
  ownerId?: string;
  ownerName?: string;
  ownerAddress?: string;
  ownerCity?: string;
  ownerCountry?: string;
  image: string;
  images?: string[];
  tags: string[];
  deliverables: string[];
  rating: number;
  orders: number;
  status: "draft" | "submitted" | "changes_requested" | "approved" | "published" | "archived";
  isVerified?: boolean;
  createdAt: string;
  updatedAt: string;
};

function splitLines(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function price(value: string, currency: StudioCurrency = "USD") {
  const normalized = value.trim().replace(/^(USD|FRW|\$)\s*/i, "").replace(/\s*(USD|FRW)$/i, "");
  return currency === "FRW" ? `FRW ${normalized || "0"}` : `$${normalized || "0"}`;
}

function currencyFromPrice(value?: string, fallback: StudioCurrency = "USD"): StudioCurrency {
  const normalized = String(value ?? "").trim().toUpperCase();
  return normalized.startsWith("FRW") || normalized.includes(" FRW") ? "FRW" : fallback;
}

function studioMoney(value: string) {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return "$0";
  if (/^(FRW|USD|\$)/i.test(trimmed)) return trimmed;
  return `$${trimmed}`;
}

function numericPrice(value: string) {
  return Number(value.replace(/[^\d.]/g, "")) || 0;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function gigScore(gig: StudioGig) {
  const tagScore = Math.min(30, gig.tags.length * 6);
  const deliveryScore = gig.deliveryDays <= 3 ? 25 : gig.deliveryDays <= 7 ? 18 : 10;
  const revisionScore = Math.min(20, gig.revisions * 5);
  const copyScore = Math.min(25, Math.round(gig.description.length / 8));

  return Math.min(100, tagScore + deliveryScore + revisionScore + copyScore);
}

export function FreelancerGigManager({
  freelancerId,
  freelancerName = "MR Creativist Freelancer",
  defaultCity = "Kigali",
  defaultCountry = "Rwanda",
  initialGigs = []
}: {
  freelancerId?: string;
  freelancerName?: string;
  defaultCity?: string;
  defaultCountry?: string;
  initialGigs?: StudioGig[];
}) {
  const [gigs, setGigs] = useState(initialGigs);
  const [editingSlug, setEditingSlug] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState("");
  const [gigImages, setGigImages] = useState<string[]>([defaultGigImage]);
  const [form, setForm] = useState({
    title: "AI course launch landing page",
    category: "AI Automation",
    packageName: "Launch package",
    description:
      "I will create a conversion-focused landing page, offer structure, launch copy, and handoff checklist for your online course.",
    price: "250",
    currency: "USD" as StudioCurrency,
    deliveryDays: "5",
    revisions: "2",
    image: defaultGigImage,
    ownerAddress: "",
    ownerCity: defaultCity,
    ownerCountry: defaultCountry,
    tags: "Landing page\nCourse launch\nCopywriting\nAI workflow",
    deliverables: "Landing page copy\nOffer structure\nCTA blocks\nLaunch checklist"
  });

  const selectedGig = gigs.find((gig) => gig.slug === editingSlug);
  const publicCount = gigs.filter((gig) => gig.status === "published").length;
  const reviewCount = gigs.filter((gig) => ["submitted", "approved", "changes_requested"].includes(gig.status)).length;
  const averageScore = gigs.length
    ? Math.round(gigs.reduce((total, gig) => total + gigScore(gig), 0) / gigs.length)
    : 0;

  const previewGig = useMemo<StudioGig>(
    () => ({
      title: form.title,
      slug: editingSlug || "preview",
      category: form.category,
      packageName: form.packageName,
      description: form.description,
      price: price(form.price, form.currency),
      currency: form.currency,
      deliveryDays: Number(form.deliveryDays) || 1,
      revisions: Number(form.revisions) || 0,
      ownerId: freelancerId,
      ownerName: freelancerName,
      ownerAddress: form.ownerAddress,
      ownerCity: form.ownerCity,
      ownerCountry: form.ownerCountry,
      image: form.image || defaultGigImage,
      images: gigImages,
      tags: splitLines(form.tags),
      deliverables: splitLines(form.deliverables),
      rating: selectedGig?.rating ?? 5,
      orders: selectedGig?.orders ?? 0,
      status: selectedGig?.status ?? "draft",
      isVerified: selectedGig?.isVerified,
      createdAt: selectedGig?.createdAt ?? new Date().toISOString(),
      updatedAt: selectedGig?.updatedAt ?? new Date().toISOString()
    }),
    [editingSlug, form, freelancerId, freelancerName, gigImages, selectedGig]
  );

  function update(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function resetForm() {
    setEditingSlug("");
    setGigImages([defaultGigImage]);
    setForm({
      title: "AI course launch landing page",
      category: "AI Automation",
      packageName: "Launch package",
      description:
        "I will create a conversion-focused landing page, offer structure, launch copy, and handoff checklist for your online course.",
      price: "250",
      currency: "USD" as StudioCurrency,
      deliveryDays: "5",
      revisions: "2",
      image: defaultGigImage,
      ownerAddress: "",
      ownerCity: defaultCity,
      ownerCountry: defaultCountry,
      tags: "Landing page\nCourse launch\nCopywriting\nAI workflow",
      deliverables: "Landing page copy\nOffer structure\nCTA blocks\nLaunch checklist"
    });
    setShowForm(true);
  }

  function selectGig(gig: StudioGig) {
    setEditingSlug(gig.slug);
    setGigImages(gig.images?.length ? gig.images : [gig.image]);
    setForm({
      title: gig.title,
      category: gig.category,
      packageName: gig.packageName,
      description: gig.description,
      price: String(gig.price).replace(/[^\d.]/g, ""),
      currency: currencyFromPrice(gig.price, gig.currency === "FRW" ? "FRW" : "USD"),
      deliveryDays: String(gig.deliveryDays),
      revisions: String(gig.revisions),
      image: gig.image,
      ownerAddress: gig.ownerAddress ?? "",
      ownerCity: gig.ownerCity ?? defaultCity,
      ownerCountry: gig.ownerCountry ?? defaultCountry,
      tags: gig.tags.join("\n"),
      deliverables: gig.deliverables.join("\n")
    });
    setShowForm(true);
    setMessage(`Editing ${gig.title}.`);
  }

  async function save(status: "draft" | "submitted") {
    const requiredFields = [
      ["Gig title", form.title],
      ["Category", form.category],
      ["Package name", form.packageName],
      ["Description", form.description],
      ["Price", form.price],
      ["Delivery days", form.deliveryDays],
      ["Cover image", gigImages[0] || form.image],
      ["Deliverables", form.deliverables]
    ];
    const missing = requiredFields.filter(([, value]) => !String(value ?? "").trim()).map(([label]) => label);
    if (missing.length) {
      const nextMessage = `Missing required fields: ${missing.join(", ")}.`;
      setMessage(nextMessage);
      toast.error(nextMessage);
      return;
    }

    const payload = {
      title: form.title.trim() || "Freelancer service",
      category: form.category.trim() || "Creative service",
      packageName: form.packageName.trim() || "Standard package",
      description: form.description.trim(),
      price: numericPrice(form.price),
      currency: form.currency,
      deliveryDays: Number(form.deliveryDays) || 1,
      revisions: Number(form.revisions) || 0,
      ownerName: freelancerName,
      ownerAddress: form.ownerAddress,
      ownerCity: form.ownerCity,
      ownerCountry: form.ownerCountry,
      image: gigImages[0] || form.image || defaultGigImage,
      images: gigImages.length ? gigImages : [form.image || defaultGigImage],
      tags: splitLines(form.tags),
      deliverables: splitLines(form.deliverables),
      status
    };

    setBusy(status);
    setMessage(status === "submitted" ? "Submitting gig for admin review..." : "Saving gig draft...");

    try {
      const response = await fetch(editingSlug ? `/api/gigs/${editingSlug}` : "/api/gigs", {
        method: editingSlug ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const saved = await response.json();

      if (!response.ok) throw new Error(saved.error ?? "Gig save failed.");

      setGigs((current) => {
        const exists = current.some((gig) => gig.slug === saved.slug);
        return exists ? current.map((gig) => (gig.slug === saved.slug ? saved : gig)) : [saved, ...current];
      });
      setEditingSlug(saved.slug);
      setShowForm(false);
      const nextMessage = status === "submitted" ? "Gig submitted. Admin can approve, verify, and publish it." : "Gig draft saved.";
      setMessage(nextMessage);
      toast.success(nextMessage);
    } catch (error) {
      const nextMessage = error instanceof Error ? error.message : "Gig save failed.";
      setMessage(nextMessage);
      toast.error(nextMessage);
    } finally {
      setBusy("");
    }
  }

  async function archiveGig(gig: StudioGig) {
    if (!window.confirm(`Archive ${gig.title}?`)) return;

    setBusy(`archive:${gig.slug}`);
    try {
      const response = await fetch(`/api/gigs/${gig.slug}`, { method: "DELETE" });
      const payload = await response.json();

      if (!response.ok) throw new Error(payload.error ?? "Gig archive failed.");

      const item = payload.item ?? { ...gig, status: "archived" };
      setGigs((current) => current.map((row) => (row.slug === gig.slug ? item : row)));
      setMessage("Gig archived.");
      toast.success("Gig archived.");
    } catch (error) {
      const nextMessage = error instanceof Error ? error.message : "Gig archive failed.";
      setMessage(nextMessage);
      toast.error(nextMessage);
    } finally {
      setBusy("");
    }
  }

  async function submitExistingGig(gig: StudioGig) {
    setBusy(`submit:${gig.slug}`);
    try {
      const response = await fetch(`/api/gigs/${gig.slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "submitted" })
      });
      const payload = await response.json();

      if (!response.ok) throw new Error(payload.error ?? "Gig submit failed.");

      setGigs((current) => current.map((row) => (row.slug === gig.slug ? payload : row)));
      setMessage("Gig submitted for admin review.");
      toast.success("Gig submitted for admin review.");
    } catch (error) {
      const nextMessage = error instanceof Error ? error.message : "Gig submit failed.";
      setMessage(nextMessage);
      toast.error(nextMessage);
    } finally {
      setBusy("");
    }
  }

  function handleImageUpload(file?: File) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const value = String(reader.result ?? defaultGigImage);
      setGigImages((current) => [...current.filter((image) => image !== defaultGigImage), value]);
      if (!gigImages.length || gigImages[0] === defaultGigImage) update("image", value);
      setMessage("Service image added to the gallery.");
    };
    reader.readAsDataURL(file);
  }

  function shareGig(gig: StudioGig) {
    const path = `${window.location.origin}/freelancers#${gig.slug}`;
    void navigator.clipboard?.writeText(path);
    setMessage("Public gig link copied.");
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <div className="flex justify-end">
        <Button type="button" onClick={resetForm}>
          <Upload className="size-4" />
          Create gig
        </Button>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          { label: "Total gigs", value: gigs.length },
          { label: "Public", value: publicCount },
          { label: "Review", value: reviewCount },
          { label: "Quality score", value: `${averageScore}%` }
        ].map((item) => (
          <Card key={item.label}>
            <CardContent className="p-5">
              <p className="text-sm font-medium text-[hsl(var(--muted-foreground))]">{item.label}</p>
              <p className="mt-2 text-3xl font-semibold">{item.value}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      {showForm ? (
      <section className="grid gap-4 xl:grid-cols-[1fr_0.75fr]">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <BriefcaseBusiness className="size-5 text-[hsl(var(--primary))]" />
              <CardTitle>{editingSlug ? "Edit gig" : "Create gig"}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium">
              Gig title
              <Input value={form.title} onChange={(event) => update("title", event.target.value)} required minLength={3} />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Category
              <Input value={form.category} onChange={(event) => update("category", event.target.value)} required minLength={2} />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Package name
              <Input value={form.packageName} onChange={(event) => update("packageName", event.target.value)} required minLength={2} />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Price
              <Input value={form.price} onChange={(event) => update("price", event.target.value)} inputMode="decimal" required />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Currency
              <select
                value={form.currency}
                onChange={(event) => setForm((current) => ({ ...current, currency: event.target.value as StudioCurrency }))}
                className="h-10 rounded-md border border-[hsl(var(--border))] bg-transparent px-3"
              >
                <option value="USD">USD</option>
                <option value="FRW">FRW</option>
              </select>
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Delivery days
              <Input value={form.deliveryDays} onChange={(event) => update("deliveryDays", event.target.value)} inputMode="numeric" required />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Revisions
              <Input value={form.revisions} onChange={(event) => update("revisions", event.target.value)} inputMode="numeric" />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Country
              <Input value={form.ownerCountry} onChange={(event) => update("ownerCountry", event.target.value)} />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              City
              <Input value={form.ownerCity} onChange={(event) => update("ownerCity", event.target.value)} />
            </label>
            <label className="grid gap-2 text-sm font-medium md:col-span-2">
              Address or service location
              <Input value={form.ownerAddress} onChange={(event) => update("ownerAddress", event.target.value)} placeholder="Remote, Kigali studio, office address..." />
            </label>
            <label className="grid gap-2 text-sm font-medium md:col-span-2">
              Description
              <textarea
                value={form.description}
                onChange={(event) => update("description", event.target.value)}
                required
                minLength={20}
                className="min-h-28 rounded-md border border-[hsl(var(--border))] bg-transparent p-3 outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
              />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Tags
              <textarea
                value={form.tags}
                onChange={(event) => update("tags", event.target.value)}
                className="min-h-28 rounded-md border border-[hsl(var(--border))] bg-transparent p-3 outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
              />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Deliverables
              <textarea
                value={form.deliverables}
                onChange={(event) => update("deliverables", event.target.value)}
                required
                className="min-h-28 rounded-md border border-[hsl(var(--border))] bg-transparent p-3 outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
              />
            </label>
            <label className="grid gap-2 text-sm font-medium md:col-span-2">
              Cover image URL
              <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                <Input value={form.image} onChange={(event) => update("image", event.target.value)} required />
                <Button asChild type="button" variant="outline">
                  <label className="cursor-pointer">
                    <ImagePlus className="size-4" />
                    Upload
                    <input type="file" accept="image/*" multiple className="sr-only" onChange={(event) => Array.from(event.target.files ?? []).forEach(handleImageUpload)} />
                  </label>
                </Button>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
                {gigImages.map((image, index) => <div key={`${image}-${index}`} className="relative overflow-hidden rounded-md border border-[hsl(var(--border))]"><button type="button" onClick={() => { setGigImages((current) => [image, ...current.filter((_, itemIndex) => itemIndex !== index)]); update("image", image); }} className="block w-full"><img src={image} alt="" className="aspect-square w-full object-cover" /></button><button type="button" onClick={() => setGigImages((current) => current.filter((_, itemIndex) => itemIndex !== index))} className="absolute right-1 top-1 grid size-6 place-items-center rounded bg-black/70 text-white" aria-label={`Remove service image ${index + 1}`}><Trash2 className="size-3" /></button>{index === 0 ? <span className="absolute bottom-1 left-1 rounded bg-black/70 px-1 text-[10px] text-white">Cover</span> : null}</div>)}
              </div>
            </label>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Public preview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="overflow-hidden rounded-md border border-[hsl(var(--border))]">
              <img src={previewGig.image} alt={previewGig.title} className="aspect-[4/3] w-full object-cover" />
              <div className="space-y-3 p-4">
                <div className="flex flex-wrap gap-2">
                  <Badge>{previewGig.category}</Badge>
                  <Badge>{gigScore(previewGig)}% score</Badge>
                </div>
                <h2 className="text-xl font-semibold">{previewGig.title}</h2>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[hsl(var(--muted-foreground))]">
                  {previewGig.ownerName} - {[previewGig.ownerCity, previewGig.ownerCountry].filter(Boolean).join(", ") || "Remote"}
                </p>
                <p className="text-sm leading-6 text-[hsl(var(--muted-foreground))]">{previewGig.description}</p>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xl font-semibold text-[hsl(var(--primary))]">{studioMoney(previewGig.price)}</span>
                  <span className="text-sm font-medium">{previewGig.deliveryDays} days</span>
                </div>
              </div>
            </div>
            <div className="grid gap-2">
              <Button onClick={() => void save("submitted")} disabled={Boolean(busy)}>
                {busy === "submitted" ? <Upload className="size-4 animate-pulse" /> : <Send className="size-4" />}
                {busy === "submitted" ? "Submitting..." : message.includes("submitted") ? "Submitted" : "Submit for review"}
              </Button>
              <Button variant="outline" onClick={() => void save("draft")} disabled={Boolean(busy)}>
                {busy === "draft" ? <Upload className="size-4 animate-pulse" /> : <Save className="size-4" />}
                {busy === "draft" ? "Saving..." : message.includes("draft") ? "Saved draft" : "Save draft"}
              </Button>
              <Button variant="outline" onClick={resetForm}>
                <Upload className="size-4" />
                New gig
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>
                Close form
              </Button>
            </div>
            {message ? <p className="rounded-md border border-[hsl(var(--border))] p-3 text-sm">{message}</p> : null}
          </CardContent>
        </Card>
      </section>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Gig management</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[58rem] text-left text-sm">
            <thead className="border-b border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))]">
              <tr>
                <th className="p-4 font-medium">Gig</th>
                <th className="p-4 font-medium">Price</th>
                <th className="p-4 font-medium">Score</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Updated</th>
                <th className="p-4 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[hsl(var(--border))]">
              {gigs.length ? (
                gigs.map((gig) => (
                  <tr key={gig.slug}>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img src={gig.image} alt={gig.title} className="size-12 rounded-md object-cover" />
                        <div>
                          <p className="font-semibold">{gig.title}</p>
                          <p className="text-xs text-[hsl(var(--muted-foreground))]">{gig.category}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4"><span className="text-sm font-semibold">{studioMoney(gig.price)}</span></td>
                    <td className="p-4"><Badge>{gigScore(gig)}%</Badge></td>
                    <td className="p-4"><Badge>{gig.status}</Badge></td>
                    <td className="p-4 text-[hsl(var(--muted-foreground))]">{formatDate(gig.updatedAt)}</td>
                    <td className="p-4">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => selectGig(gig)}>
                          <Edit3 className="size-4" />
                          Edit
                        </Button>
                        {gig.status === "published" ? null : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => void submitExistingGig(gig)}
                            disabled={busy === `submit:${gig.slug}`}
                          >
                            <Send className="size-4" />
                            Submit
                          </Button>
                        )}
                        <Button size="sm" variant="outline" onClick={() => shareGig(gig)}>
                          <Share2 className="size-4" />
                          Share
                        </Button>
                        <Button asChild size="sm" variant="outline">
                          <Link href="/freelancers">
                            <Eye className="size-4" />
                            Public
                          </Link>
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => void archiveGig(gig)} disabled={busy === `archive:${gig.slug}`}>
                          <Trash2 className="size-4" />
                          Archive
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="p-6 text-center text-[hsl(var(--muted-foreground))]" colSpan={6}>
                    No gigs yet. Create your first package and submit it for admin review.
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
