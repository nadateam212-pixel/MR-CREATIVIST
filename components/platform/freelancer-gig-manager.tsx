"use client";

/* eslint-disable @next/next/no-img-element */

import { useMemo, useState } from "react";
import Link from "next/link";
import { Archive, BriefcaseBusiness, Edit3, Eye, ImagePlus, Save, Send, Share2, Trash2, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PriceDisplay } from "@/components/ui/price-display";
import { type PlatformGigDraft, usePlatformStore } from "@/hooks/use-platform-store";

const defaultGigImage = "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=1200&q=85";

function splitLines(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function price(value: string) {
  const normalized = value.trim().replace(/^\$/, "");
  return `$${normalized || "0"}`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function gigScore(gig: PlatformGigDraft) {
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
  defaultCountry = "Rwanda"
}: {
  freelancerId?: string;
  freelancerName?: string;
  defaultCity?: string;
  defaultCountry?: string;
}) {
  const createGig = usePlatformStore((state) => state.createGig);
  const updateGig = usePlatformStore((state) => state.updateGig);
  const updateGigStatus = usePlatformStore((state) => state.updateGigStatus);
  const deleteGig = usePlatformStore((state) => state.deleteGig);
  const createdGigs = usePlatformStore((state) => state.createdGigs);
  const [editingSlug, setEditingSlug] = useState("");
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    title: "AI course launch landing page",
    category: "AI Automation",
    packageName: "Launch package",
    description:
      "I will create a conversion-focused landing page, offer structure, launch copy, and handoff checklist for your online course.",
    price: "250",
    deliveryDays: "5",
    revisions: "2",
    image: defaultGigImage,
    ownerAddress: "",
    ownerCity: defaultCity,
    ownerCountry: defaultCountry,
    tags: "Landing page\nCourse launch\nCopywriting\nAI workflow",
    deliverables: "Landing page copy\nOffer structure\nCTA blocks\nLaunch checklist"
  });

  const selectedGig = createdGigs.find((gig) => gig.slug === editingSlug);
  const publishedCount = createdGigs.filter((gig) => gig.status === "published").length;
  const averageScore = createdGigs.length
    ? Math.round(createdGigs.reduce((total, gig) => total + gigScore(gig), 0) / createdGigs.length)
    : 0;

  const previewGig = useMemo<PlatformGigDraft>(
    () => ({
      title: form.title,
      slug: editingSlug || "preview",
      category: form.category,
      packageName: form.packageName,
      description: form.description,
      price: price(form.price),
      deliveryDays: Number(form.deliveryDays) || 1,
      revisions: Number(form.revisions) || 0,
      freelancer: freelancerName,
      ownerId: freelancerId,
      ownerName: freelancerName,
      ownerAddress: form.ownerAddress,
      ownerCity: form.ownerCity,
      ownerCountry: form.ownerCountry,
      image: form.image || defaultGigImage,
      tags: splitLines(form.tags),
      deliverables: splitLines(form.deliverables),
      rating: selectedGig?.rating ?? 5,
      orders: selectedGig?.orders ?? 0,
      status: selectedGig?.status ?? "draft",
      createdAt: selectedGig?.createdAt ?? new Date().toISOString(),
      updatedAt: selectedGig?.updatedAt ?? new Date().toISOString()
    }),
    [editingSlug, form, freelancerId, freelancerName, selectedGig]
  );

  function update(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function resetForm() {
    setEditingSlug("");
    setForm({
      title: "AI course launch landing page",
      category: "AI Automation",
      packageName: "Launch package",
      description:
        "I will create a conversion-focused landing page, offer structure, launch copy, and handoff checklist for your online course.",
      price: "250",
      deliveryDays: "5",
      revisions: "2",
      image: defaultGigImage,
      ownerAddress: "",
      ownerCity: defaultCity,
      ownerCountry: defaultCountry,
      tags: "Landing page\nCourse launch\nCopywriting\nAI workflow",
      deliverables: "Landing page copy\nOffer structure\nCTA blocks\nLaunch checklist"
    });
  }

  function selectGig(gig: PlatformGigDraft) {
    setEditingSlug(gig.slug);
    setForm({
      title: gig.title,
      category: gig.category,
      packageName: gig.packageName,
      description: gig.description,
      price: gig.price.replace(/^\$/, ""),
      deliveryDays: String(gig.deliveryDays),
      revisions: String(gig.revisions),
      image: gig.image,
      ownerAddress: gig.ownerAddress ?? "",
      ownerCity: gig.ownerCity ?? defaultCity,
      ownerCountry: gig.ownerCountry ?? defaultCountry,
      tags: gig.tags.join("\n"),
      deliverables: gig.deliverables.join("\n")
    });
    setMessage(`Editing ${gig.title}.`);
  }

  function save(status: "draft" | "published") {
    const payload = {
      title: form.title.trim() || "Freelancer service",
      category: form.category.trim() || "Creative service",
      packageName: form.packageName.trim() || "Standard package",
      description: form.description.trim(),
      price: price(form.price),
      deliveryDays: Number(form.deliveryDays) || 1,
      revisions: Number(form.revisions) || 0,
      freelancer: freelancerName,
      ownerId: freelancerId,
      ownerName: freelancerName,
      ownerAddress: form.ownerAddress,
      ownerCity: form.ownerCity,
      ownerCountry: form.ownerCountry,
      image: form.image || defaultGigImage,
      tags: splitLines(form.tags),
      deliverables: splitLines(form.deliverables),
      status
    };

    if (editingSlug) {
      updateGig(editingSlug, payload);
      updateGigStatus(editingSlug, status);
      setMessage(status === "published" ? "Gig updated and visible on the public freelancer page." : "Gig draft updated.");
      return;
    }

    const slug = createGig(payload);
    setEditingSlug(slug);
    setMessage(status === "published" ? "Gig published to the public freelancer page." : "Gig saved as draft.");
  }

  function handleImageUpload(file?: File) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      update("image", String(reader.result ?? defaultGigImage));
      setMessage("Gig cover image uploaded.");
    };
    reader.readAsDataURL(file);
  }

  function shareGig(gig: PlatformGigDraft) {
    const path = `${window.location.origin}/freelancers#${gig.slug}`;
    void navigator.clipboard?.writeText(path);
    setMessage("Public gig link copied.");
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <section className="grid gap-4 md:grid-cols-3">
        {[
          { label: "Total gigs", value: createdGigs.length },
          { label: "Published", value: publishedCount },
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
              <Input value={form.title} onChange={(event) => update("title", event.target.value)} />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Category
              <Input value={form.category} onChange={(event) => update("category", event.target.value)} />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Package name
              <Input value={form.packageName} onChange={(event) => update("packageName", event.target.value)} />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Price
              <Input value={form.price} onChange={(event) => update("price", event.target.value)} inputMode="decimal" />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Delivery days
              <Input value={form.deliveryDays} onChange={(event) => update("deliveryDays", event.target.value)} inputMode="numeric" />
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
                className="min-h-28 rounded-md border border-[hsl(var(--border))] bg-transparent p-3 outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
              />
            </label>
            <label className="grid gap-2 text-sm font-medium md:col-span-2">
              Cover image URL
              <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                <Input value={form.image} onChange={(event) => update("image", event.target.value)} />
                <Button asChild type="button" variant="outline">
                  <label className="cursor-pointer">
                    <ImagePlus className="size-4" />
                    Upload
                    <input type="file" accept="image/*" className="sr-only" onChange={(event) => handleImageUpload(event.target.files?.[0])} />
                  </label>
                </Button>
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
                  <PriceDisplay price={previewGig.price} className="text-xl text-[hsl(var(--primary))]" />
                  <span className="text-sm font-medium">{previewGig.deliveryDays} days</span>
                </div>
              </div>
            </div>
            <div className="grid gap-2">
              <Button onClick={() => save("published")}>
                <Send className="size-4" />
                Publish to freelancer page
              </Button>
              <Button variant="outline" onClick={() => save("draft")}>
                <Save className="size-4" />
                Save draft
              </Button>
              <Button variant="outline" onClick={resetForm}>
                <Upload className="size-4" />
                New gig
              </Button>
            </div>
            {message ? <p className="rounded-md border border-[hsl(var(--border))] p-3 text-sm">{message}</p> : null}
          </CardContent>
        </Card>
      </section>

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
              {createdGigs.length ? (
                createdGigs.map((gig) => (
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
                    <td className="p-4"><PriceDisplay price={gig.price} className="text-sm" /></td>
                    <td className="p-4"><Badge>{gigScore(gig)}%</Badge></td>
                    <td className="p-4"><Badge>{gig.status}</Badge></td>
                    <td className="p-4 text-[hsl(var(--muted-foreground))]">{formatDate(gig.updatedAt)}</td>
                    <td className="p-4">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => selectGig(gig)}>
                          <Edit3 className="size-4" />
                          Edit
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => updateGigStatus(gig.slug, gig.status === "published" ? "draft" : "published")}>
                          {gig.status === "published" ? <Archive className="size-4" /> : <Send className="size-4" />}
                          {gig.status === "published" ? "Pause" : "Publish"}
                        </Button>
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
                        <Button size="sm" variant="outline" onClick={() => deleteGig(gig.slug)}>
                          <Trash2 className="size-4" />
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="p-6 text-center text-[hsl(var(--muted-foreground))]" colSpan={6}>
                    No gigs yet. Create your first package and publish it to the public freelancer page.
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
