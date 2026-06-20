"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useState } from "react";
import { Eye, ImagePlus, Loader2, Plus, Save, Send, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type PortfolioItem = { title: string; url: string; image?: string };
type ProfileRecord = {
  id: string;
  slug: string;
  name: string;
  role: string;
  specialty: string;
  location: string;
  hourlyRate: number;
  rating?: number;
  completedJobs?: number;
  responseHours: number;
  availabilityPercent: number;
  portfolioScore: number;
  languages: string[];
  skills: string[];
  verifiedBadges: string[];
  image: string;
  bio?: string;
  portfolio: PortfolioItem[];
  status: string;
};

function splitList(value: string) {
  return value.split(/[,\n]/).map((item) => item.trim()).filter(Boolean);
}

export function FreelancerProfileEditor({ initialProfile, user }: { initialProfile: ProfileRecord | null; user: { name: string; image: string } }) {
  const [profileId, setProfileId] = useState(initialProfile?.id ?? "");
  const [slug, setSlug] = useState(initialProfile?.slug ?? "");
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>(initialProfile?.portfolio ?? []);
  const [busy, setBusy] = useState("");
  const [form, setForm] = useState({
    name: initialProfile?.name ?? user.name,
    role: initialProfile?.role ?? "Creative freelancer",
    specialty: initialProfile?.specialty ?? "Creative services",
    location: initialProfile?.location ?? "Kigali, Rwanda",
    hourlyRate: String(initialProfile?.hourlyRate ?? 0),
    responseHours: String(initialProfile?.responseHours ?? 8),
    availabilityPercent: String(initialProfile?.availabilityPercent ?? 80),
    portfolioScore: String(initialProfile?.portfolioScore ?? 80),
    languages: (initialProfile?.languages ?? ["English", "Kinyarwanda"]).join(", "),
    skills: (initialProfile?.skills ?? ["Creative strategy", "Digital content"]).join(", "),
    image: initialProfile?.image ?? user.image,
    bio: initialProfile?.bio ?? "",
    status: initialProfile?.status ?? "draft"
  });

  function update(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function updatePortfolio(index: number, field: keyof PortfolioItem, value: string) {
    setPortfolio((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item));
  }

  async function uploadImage(file: File | undefined, onComplete: (url: string) => void) {
    if (!file) return;
    setBusy("upload");
    try {
      const data = new FormData();
      data.set("file", file);
      data.set("kind", "image");
      data.set("ownerType", "profile");
      if (profileId) data.set("ownerId", profileId);
      const response = await fetch("/api/upload", { method: "POST", body: data });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Image upload failed.");
      const url = payload.asset?.secureUrl ?? payload.asset?.url;
      if (!url) throw new Error("Upload did not return an image URL.");
      onComplete(url);
      toast.success("Image uploaded.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Image upload failed.");
    } finally {
      setBusy("");
    }
  }

  async function save(status: "draft" | "submitted") {
    if (!form.name.trim() || !form.role.trim() || !form.specialty.trim() || !form.location.trim() || !form.bio.trim()) {
      toast.error("Complete your name, role, specialty, location, and biography before saving.");
      return;
    }
    const languages = splitList(form.languages);
    const skills = splitList(form.skills);
    if (!languages.length || !skills.length) {
      toast.error("Add at least one language and one skill.");
      return;
    }

    setBusy(status);
    try {
      const response = await fetch(profileId ? `/api/freelancers/${profileId}` : "/api/freelancers", {
        method: profileId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          role: form.role,
          specialty: form.specialty,
          location: form.location,
          hourlyRate: Number(form.hourlyRate) || 0,
          responseHours: Number(form.responseHours) || 24,
          availabilityPercent: Number(form.availabilityPercent) || 0,
          portfolioScore: Number(form.portfolioScore) || 0,
          rating: initialProfile?.rating ?? 0,
          completedJobs: initialProfile?.completedJobs ?? 0,
          languages,
          skills,
          verifiedBadges: initialProfile?.verifiedBadges ?? [],
          image: form.image || "/icons/logo.png",
          bio: form.bio,
          gigs: [],
          portfolio: portfolio.filter((item) => item.title.trim() && item.url.trim()),
          status,
          isVerified: false
        })
      });
      const payload = await response.json();
      if (!response.ok || payload.error) throw new Error(payload.error ?? "Profile save failed.");
      setProfileId(String(payload.profileId ?? payload.id ?? profileId));
      setSlug(String(payload.slug ?? slug));
      update("status", String(payload.status ?? status));
      toast.success(status === "submitted" ? "Profile submitted and published for review." : "Profile draft saved.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Profile save failed.");
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="content-frame space-y-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div><Badge>{form.status.replaceAll("_", " ")}</Badge><h1 className="mt-2 text-3xl font-black">Freelancer profile</h1><p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">Complete the public profile clients see before they hire you.</p></div>
        {slug ? <Button asChild variant="outline"><Link href={`/freelancers/${slug}`}><Eye className="size-4" />View public profile</Link></Button> : null}
      </header>

      <div className="grid gap-5 xl:grid-cols-[1fr_22rem]">
        <div className="space-y-5">
          <Card className="rounded-md"><CardHeader><CardTitle>Professional details</CardTitle></CardHeader><CardContent className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-semibold">Display name<Input value={form.name} onChange={(event) => update("name", event.target.value)} /></label>
            <label className="grid gap-2 text-sm font-semibold">Professional title<Input value={form.role} onChange={(event) => update("role", event.target.value)} /></label>
            <label className="grid gap-2 text-sm font-semibold">Specialty<Input value={form.specialty} onChange={(event) => update("specialty", event.target.value)} /></label>
            <label className="grid gap-2 text-sm font-semibold">Location<Input value={form.location} onChange={(event) => update("location", event.target.value)} /></label>
            <label className="grid gap-2 text-sm font-semibold">Hourly rate (FRW)<Input inputMode="numeric" value={form.hourlyRate} onChange={(event) => update("hourlyRate", event.target.value)} /></label>
            <label className="grid gap-2 text-sm font-semibold">Response time (hours)<Input inputMode="numeric" value={form.responseHours} onChange={(event) => update("responseHours", event.target.value)} /></label>
            <label className="grid gap-2 text-sm font-semibold">Availability (%)<Input inputMode="numeric" value={form.availabilityPercent} onChange={(event) => update("availabilityPercent", event.target.value)} /></label>
            <label className="grid gap-2 text-sm font-semibold">Portfolio completion (%)<Input inputMode="numeric" value={form.portfolioScore} onChange={(event) => update("portfolioScore", event.target.value)} /></label>
            <label className="grid gap-2 text-sm font-semibold md:col-span-2">Biography<textarea value={form.bio} onChange={(event) => update("bio", event.target.value)} className="min-h-36 rounded-md border border-[hsl(var(--border))] bg-transparent p-3" placeholder="Describe your experience, process, and the results clients can expect." /></label>
            <label className="grid gap-2 text-sm font-semibold">Languages<Input value={form.languages} onChange={(event) => update("languages", event.target.value)} placeholder="English, Kinyarwanda" /></label>
            <label className="grid gap-2 text-sm font-semibold">Skills<Input value={form.skills} onChange={(event) => update("skills", event.target.value)} placeholder="Video editing, Strategy" /></label>
          </CardContent></Card>

          <Card id="portfolio" className="rounded-md"><CardHeader className="flex flex-row items-center justify-between"><CardTitle>Portfolio gallery</CardTitle><Button size="sm" variant="outline" onClick={() => setPortfolio((current) => [...current, { title: "", url: "", image: "" }])}><Plus className="size-4" />Add project</Button></CardHeader><CardContent className="space-y-4">
            {portfolio.map((item, index) => <div key={index} className="grid gap-3 rounded-md border border-[hsl(var(--border))] p-3 md:grid-cols-[9rem_1fr_auto]">
              <div className="overflow-hidden rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--muted))]">{item.image ? <img src={item.image} alt="" className="aspect-square w-full object-cover" /> : <span className="grid aspect-square place-items-center"><ImagePlus className="size-6" /></span>}</div>
              <div className="grid gap-2"><Input value={item.title} onChange={(event) => updatePortfolio(index, "title", event.target.value)} placeholder="Project title" /><Input value={item.url} onChange={(event) => updatePortfolio(index, "url", event.target.value)} placeholder="Project link or asset URL" /><Button asChild size="sm" variant="outline" className="w-max"><label className="cursor-pointer"><Upload className="size-4" />Upload image<input type="file" accept="image/*" className="sr-only" onChange={(event) => void uploadImage(event.target.files?.[0], (url) => updatePortfolio(index, "image", url))} /></label></Button></div>
              <Button size="icon" variant="ghost" aria-label="Remove project" onClick={() => setPortfolio((current) => current.filter((_, itemIndex) => itemIndex !== index))}><Trash2 className="size-4" /></Button>
            </div>)}
            {!portfolio.length ? <p className="rounded-md border border-dashed border-[hsl(var(--border))] p-6 text-center text-sm text-[hsl(var(--muted-foreground))]">Add several project images so clients can inspect your work.</p> : null}
          </CardContent></Card>
        </div>

        <aside className="space-y-4">
          <Card className="rounded-md"><CardHeader><CardTitle>Profile image</CardTitle></CardHeader><CardContent className="space-y-3"><div className="overflow-hidden rounded-md border border-[hsl(var(--border))]"><img src={form.image || "/icons/logo.png"} alt={form.name} className="aspect-square w-full object-cover" /></div><Button asChild variant="outline" className="w-full"><label className="cursor-pointer">{busy === "upload" ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}Upload portrait<input type="file" accept="image/*" className="sr-only" onChange={(event) => void uploadImage(event.target.files?.[0], (url) => update("image", url))} /></label></Button></CardContent></Card>
          <Card className="rounded-md"><CardHeader><CardTitle>Publishing</CardTitle></CardHeader><CardContent className="grid gap-2"><Button onClick={() => void save("submitted")} disabled={Boolean(busy)}>{busy === "submitted" ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}Publish profile</Button><Button variant="outline" onClick={() => void save("draft")} disabled={Boolean(busy)}>{busy === "draft" ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}Save draft</Button></CardContent></Card>
        </aside>
      </div>
    </div>
  );
}
