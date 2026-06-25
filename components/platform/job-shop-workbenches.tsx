"use client";

/* eslint-disable @next/next/no-img-element */

import { useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  BriefcaseBusiness,
  CheckCircle2,
  ExternalLink,
  Globe2,
  Loader2,
  Mail,
  MapPin,
  MessageSquare,
  Pencil,
  Phone,
  Save,
  Search,
  Send,
  Share2,
  Sparkles,
  Star,
  Store,
  Trash2,
  Upload,
  X
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { VerifiedMark } from "@/components/ui/verified-mark";
import { useUserPreferences } from "@/hooks/use-user-preferences";
import { formatConvertedAmount, type SupportedCurrency } from "@/lib/currency";

export type PublicJobPost = {
  id?: string;
  title: string;
  slug: string;
  companyName: string;
  companyLogo?: string;
  location: string;
  workplaceType: string;
  employmentType: string;
  salaryMin?: number;
  salaryMax?: number;
  currency?: "USD" | "FRW" | string;
  category: string;
  description: string;
  responsibilities?: string[];
  requirements?: string[];
  benefits?: string[];
  skills?: string[];
  applyUrl?: string;
  contactEmail?: string;
  applicationDeadline?: string;
  status?: string;
  isFeatured?: boolean;
};

export type PublicShopProfile = {
  id?: string;
  ownerId?: string;
  ownerName?: string;
  name: string;
  slug: string;
  tagline?: string;
  description: string;
  category: string;
  logo?: string;
  coverImage?: string;
  contactName?: string;
  contactEmail?: string;
  phone?: string;
  whatsapp?: string;
  website?: string;
  address?: string;
  city?: string;
  country?: string;
  openingHours?: string;
  productsOrServices?: {
    name: string;
    type: "Product" | "Service";
    description?: string;
    price?: number;
    currency?: string;
    image?: string;
  }[];
  tags?: string[];
  rating?: number;
  status?: string;
  isFeatured?: boolean;
  isVerified?: boolean;
};

function splitList(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function supportedCurrency(currency?: string): SupportedCurrency {
  return currency === "FRW" ? "FRW" : "USD";
}

function money(min = 0, max = 0, currency = "USD", targetCurrency: SupportedCurrency = "USD", usdToFrw?: number) {
  const fromCurrency = supportedCurrency(currency);

  if (min > 0 && max > 0) {
    return `${formatConvertedAmount(min, fromCurrency, targetCurrency, usdToFrw)} - ${formatConvertedAmount(max, fromCurrency, targetCurrency, usdToFrw)}`;
  }
  if (min > 0) return `From ${formatConvertedAmount(min, fromCurrency, targetCurrency, usdToFrw)}`;
  if (max > 0) return `Up to ${formatConvertedAmount(max, fromCurrency, targetCurrency, usdToFrw)}`;
  return "Salary available on request";
}

function statusTone(status?: string) {
  if (status === "published") return "border-[hsl(var(--primary))]/35 text-[hsl(var(--primary))]";
  if (status === "closed" || status === "archived") return "border-red-500/35 text-red-500";
  return "border-amber-500/35 text-amber-500";
}

export function JobsDirectory({ jobs }: { jobs: PublicJobPost[] }) {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [selectedJob, setSelectedJob] = useState<PublicJobPost | null>(null);
  const preferences = useUserPreferences();
  const categories = useMemo(() => ["All", ...Array.from(new Set(jobs.map((job) => job.category)))], [jobs]);
  const filtered = jobs.filter((job) => {
    const target = `${job.title} ${job.companyName} ${job.category} ${job.location} ${(job.skills ?? []).join(" ")}`.toLowerCase();
    return target.includes(query.toLowerCase()) && (activeCategory === "All" || job.category === activeCategory);
  });

  return (
    <div className="space-y-4">
      <section className="flex flex-col gap-3 text-[hsl(var(--foreground))] sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight sm:text-3xl">Find Your Dream Job</h1>
          <p className="mt-1 text-sm font-semibold text-[hsl(var(--muted-foreground))]">Discover amazing opportunities and build your future.</p>
        </div>
        <Badge>{filtered.length} live</Badge>
      </section>

      <div className="reference-toolbar">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
          <Input value={query} onChange={(event) => setQuery(event.target.value)} className="h-10 bg-[hsl(var(--card))] pl-10 text-sm font-semibold" placeholder="Search jobs, skills, location or company" />
        </div>
        <div className="reference-filter-row">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setActiveCategory(category)}
              className={`reference-filter-chip ${activeCategory === category ? "reference-filter-chip-active" : ""}`}
            >
              {category}
            </button>
          ))}
        </div>
        <Button variant="outline" className="hidden h-10 bg-[hsl(var(--card))] lg:inline-flex">
          <BriefcaseBusiness className="size-4" />
          Filters
        </Button>
      </div>

      <div className="reference-grid-4">
        {filtered.length ? (
          <>
            {filtered.map((job) => (
              <article key={job.slug} className="reference-card flex h-full flex-col">
                <div className="reference-card-media aspect-[4/3]">
                  <div className="relative flex h-full flex-col justify-between overflow-hidden bg-[hsl(var(--muted))] p-4">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-[hsl(var(--muted-foreground))]">We are</p>
                      <p className="mt-1 max-w-[12rem] text-3xl font-black uppercase leading-none text-[hsl(var(--foreground))]">Hiring!</p>
                      <p className="mt-2 w-fit rounded bg-[hsl(var(--primary))] px-2 py-1 text-[0.68rem] font-black uppercase text-[hsl(var(--primary-foreground))]">{job.category}</p>
                    </div>
                    <div className="grid gap-1.5 text-[0.68rem] font-bold text-[hsl(var(--muted-foreground))]">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="size-3.5 text-[hsl(var(--success))]" />
                        {job.workplaceType}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="size-3.5 text-[hsl(var(--success))]" />
                        {job.location}
                      </span>
                    </div>
                    {job.companyLogo ? (
                      <span className="absolute bottom-3 right-3 grid size-24 place-items-center overflow-hidden rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-2 shadow-xl">
                        <img src={job.companyLogo} alt={`${job.companyName} logo`} className="h-full w-full object-contain" />
                      </span>
                    ) : (
                      <BriefcaseBusiness className="absolute bottom-4 right-4 size-16 text-[hsl(var(--primary))]" />
                    )}
                  </div>
                  <span className="absolute right-2 top-2 rounded bg-black/75 px-2 py-1 text-[0.65rem] font-black uppercase text-white">
                    {job.employmentType}
                  </span>
                </div>
                <div className="flex flex-1 flex-col gap-2.5 p-3">
                  <div className="flex items-start gap-2">
                    <span className="grid size-7 shrink-0 place-items-center rounded bg-[hsl(var(--muted))] text-xs font-black text-[hsl(var(--primary))]">
                      {job.companyName?.[0] ?? "M"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="reference-card-meta flex items-center gap-1">
                        <span className="truncate">{job.companyName}</span>
                        {job.isFeatured ? <VerifiedMark label="Featured employer" className="size-3.5" /> : null}
                      </p>
                      <h2 className="reference-card-title mt-1 line-clamp-2 min-h-10">{job.title}</h2>
                    </div>
                  </div>
                  <div className="reference-card-meta flex flex-wrap gap-x-3 gap-y-1">
                    <span className="flex items-center gap-1">
                      <MapPin className="size-3.5 text-[hsl(var(--primary))]" />
                      {job.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <BriefcaseBusiness className="size-3.5 text-[hsl(var(--primary))]" />
                      {job.workplaceType}
                    </span>
                  </div>
                  <p className="reference-card-meta font-black text-[hsl(var(--foreground))]">{money(job.salaryMin, job.salaryMax, job.currency, preferences.currency, preferences.usdToFrw)}</p>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge>{job.category}</Badge>
                    {(job.skills ?? []).slice(0, 2).map((skill) => (
                      <Badge key={`${job.slug}-${skill}`}>{skill}</Badge>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedJob(job)}
                    className="reference-card-meta flex w-full items-center justify-between border-t border-[hsl(var(--border))] pt-2 text-left"
                  >
                    <span>Job Description</span>
                    <ExternalLink className="size-3.5" />
                  </button>
                  <div className="mt-auto">
                    <Button className="h-8 w-full reference-primary-action" onClick={() => setSelectedJob(job)}>
                      <ExternalLink className="size-4" />
                      Apply Now
                    </Button>
                  </div>
                </div>
              </article>
            ))}
            {Array.from({ length: (4 - (filtered.length % 4)) % 4 }).map((_, index) => (
              <article key={`job-cta-${index}`} className="reference-card flex h-full min-h-[18rem] flex-col justify-between p-4">
                <BriefcaseBusiness className="size-8 text-[hsl(var(--primary))]" />
                <div>
                  <p className="reference-card-title">Hiring?</p>
                  <p className="mt-2 text-sm font-semibold leading-6 text-[hsl(var(--muted-foreground))]">
                    Publish a job and reach MR Creativist talent.
                  </p>
                </div>
                <Button asChild className="reference-primary-action">
                  <Link href="/admin/jobs">Post a job</Link>
                </Button>
              </article>
            ))}
          </>
        ) : (
          <div className="reference-card p-8 text-center text-sm text-[hsl(var(--muted-foreground))] md:col-span-4">
            No published jobs match this search yet.
          </div>
        )}
      </div>

      {selectedJob ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 shadow-2xl">
            <div className="flex flex-col gap-4 border-b border-[hsl(var(--border))] pb-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex flex-wrap gap-2">
                  <Badge>{selectedJob.category}</Badge>
                  <Badge>{selectedJob.employmentType}</Badge>
                  <Badge>{selectedJob.workplaceType}</Badge>
                </div>
                <h2 className="mt-3 text-2xl font-semibold">{selectedJob.title}</h2>
                <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
                  {selectedJob.companyName} - {selectedJob.location}
                </p>
              </div>
              <Button size="icon" variant="outline" onClick={() => setSelectedJob(null)} aria-label="Close job details">
                <X className="size-4" />
              </Button>
            </div>

            <div className="mt-5 grid gap-5">
              <div>
                <h3 className="font-semibold">Job details</h3>
                <p className="mt-2 text-sm leading-7 text-[hsl(var(--muted-foreground))]">{selectedJob.description}</p>
              </div>
              {[
                ["Responsibilities", selectedJob.responsibilities ?? []],
                ["Requirements", selectedJob.requirements ?? []],
                ["Benefits", selectedJob.benefits ?? []]
              ].map(([title, items]) =>
                (items as string[]).length ? (
                  <div key={title as string}>
                    <h3 className="font-semibold">{title as string}</h3>
                    <ul className="mt-2 grid gap-2 text-sm text-[hsl(var(--muted-foreground))]">
                      {(items as string[]).map((item) => (
                        <li key={item} className="rounded-md border border-[hsl(var(--border))] p-3">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null
              )}
              <div className="grid gap-3 rounded-md border border-[hsl(var(--border))] p-4 text-sm sm:grid-cols-2">
                <p>
                  <span className="font-semibold">Salary: </span>
                  {money(selectedJob.salaryMin, selectedJob.salaryMax, selectedJob.currency, preferences.currency, preferences.usdToFrw)}
                </p>
                <p>
                  <span className="font-semibold">Deadline: </span>
                  {selectedJob.applicationDeadline
                    ? new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(selectedJob.applicationDeadline))
                    : "Open until filled"}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedJob.applyUrl ? (
                  <Button asChild>
                    <a href={selectedJob.applyUrl} target="_blank" rel="noreferrer">
                      <ExternalLink className="size-4" />
                      Apply on external site
                    </a>
                  </Button>
                ) : selectedJob.contactEmail ? (
                  <Button asChild>
                    <a href={`mailto:${selectedJob.contactEmail}?subject=${encodeURIComponent(selectedJob.title)}`}>
                      <Mail className="size-4" />
                      Apply by email
                    </a>
                  </Button>
                ) : (
                  <Button asChild>
                    <Link href={`/messages?subject=${encodeURIComponent(selectedJob.title)}&contextType=job&contextId=${selectedJob.slug}`}>
                      <MessageSquare className="size-4" />
                      Apply through platform
                    </Link>
                  </Button>
                )}
                <Button variant="outline" onClick={() => setSelectedJob(null)}>
                  Close details
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function ShopDirectory({ shops, showHeader = true }: { shops: PublicShopProfile[]; showHeader?: boolean }) {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const categories = useMemo(() => ["All", ...Array.from(new Set(shops.map((shop) => shop.category).filter(Boolean)))], [shops]);
  const filtered = shops.filter((shop) => {
    const target = `${shop.name} ${shop.category} ${shop.city} ${shop.country} ${(shop.tags ?? []).join(" ")}`.toLowerCase();
    return target.includes(query.toLowerCase()) && (activeCategory === "All" || shop.category === activeCategory);
  });

  return (
    <div className="space-y-4">
      {showHeader ? (
        <section className="flex flex-col gap-3 text-[hsl(var(--foreground))] sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[hsl(var(--primary))]">Businesses</p>
            <h1 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">Listed businesses</h1>
          </div>
          <Button asChild>
            <Link href="/seller/shop">
              <Store className="size-4" />
              List your business
            </Link>
          </Button>
        </section>
      ) : null}

      <div className="reference-toolbar">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
          <Input value={query} onChange={(event) => setQuery(event.target.value)} className="h-10 bg-[hsl(var(--card))] pl-10 text-sm font-semibold" placeholder="Search businesses, services, city or category" />
        </div>
        <div className="reference-filter-row">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setActiveCategory(category)}
              className={`reference-filter-chip ${activeCategory === category ? "reference-filter-chip-active" : ""}`}
            >
              {category}
            </button>
          ))}
        </div>
        <Button asChild variant="outline" className="hidden h-10 bg-[hsl(var(--card))] lg:inline-flex">
          <Link href="/seller/shop">
            <Store className="size-4" />
            List
          </Link>
        </Button>
      </div>

      <div className="reference-grid-4">
        {filtered.length ? (
          <>
            {filtered.map((shop) => {
              const address = [shop.address, shop.city, shop.country].filter(Boolean).join(", ") || "Online";
              const status = String(shop.status ?? "published").toLowerCase();
              const isOpen = !["closed", "archived"].includes(status);
              const directionsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
              const websiteHref = shop.website?.startsWith("http") ? shop.website : shop.website ? `https://${shop.website}` : "";

              return (
                <article key={shop.slug} className="reference-card flex h-full flex-col p-3">
                  <div className="flex items-start gap-3">
                    <span className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-md border border-[hsl(var(--border))] bg-white p-1">
                      <img src={shop.logo || shop.coverImage || "/icons/logo.png"} alt={`${shop.name} logo`} className="h-full w-full object-contain" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="flex min-w-0 items-center gap-1.5 font-black leading-tight">
                        <span className="truncate">{shop.name}</span>
                        {shop.isVerified ? <VerifiedMark label="Verified business" className="size-3.5" /> : null}
                      </p>
                      <p className="mt-1 line-clamp-1 text-xs font-semibold text-[hsl(var(--muted-foreground))]">{shop.category}</p>
                      <p className="mt-2 text-xs font-semibold text-[hsl(var(--muted-foreground))]">
                        <Star className="mr-1 inline size-3 fill-amber-400 text-amber-400" />
                        {(shop.rating ?? 0).toFixed(1)} {shop.isFeatured ? "(Featured)" : "(Reviews)"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {(shop.tags?.length ? shop.tags : [shop.category, shop.openingHours, shop.ownerName])
                      .filter(Boolean)
                      .slice(0, 3)
                      .map((tag) => (
                        <Badge key={`${shop.slug}-${tag}`}>{tag}</Badge>
                      ))}
                  </div>

                  <div className="mt-4 grid gap-2 text-sm">
                    <p className={`flex items-center gap-2 font-semibold ${isOpen ? "text-[hsl(var(--success))]" : "text-red-500"}`}>
                      <CheckCircle2 className="size-4" />
                      {isOpen ? "Open now" : "Closed"}
                    </p>
                    <p className="reference-card-meta flex items-start gap-2">
                      <MapPin className="mt-0.5 size-4 shrink-0 text-[hsl(var(--foreground))]" />
                      <span className="line-clamp-1">{address}</span>
                    </p>
                    <a href={directionsHref} target="_blank" rel="noreferrer" className="reference-card-meta flex items-center gap-2 text-[hsl(var(--primary))]">
                      <ExternalLink className="size-4" />
                      Get Directions
                    </a>
                  </div>

                  <p className="mt-3 line-clamp-2 text-sm leading-5 text-[hsl(var(--muted-foreground))]">
                    {shop.tagline || shop.description}
                  </p>

                  <div className="business-actions-grid mt-auto pt-4">
                    <Button asChild size="sm" className="business-action-button h-9">
                      <a href={shop.whatsapp ? `https://wa.me/${shop.whatsapp.replace(/\D/g, "")}` : `mailto:${shop.contactEmail ?? ""}`} target={shop.whatsapp ? "_blank" : undefined} rel={shop.whatsapp ? "noreferrer" : undefined}>
                        <MessageSquare className="size-4" />
                        <span className="reference-action-label">{shop.whatsapp ? "WhatsApp" : "Email"}</span>
                      </a>
                    </Button>
                    <Button asChild size="sm" variant="outline" className="business-action-button h-9">
                      <a href={shop.phone ? `tel:${shop.phone.replace(/\D/g, "")}` : `mailto:${shop.contactEmail ?? ""}`}>
                        <Phone className="size-4" />
                        <span className="reference-action-label">Call</span>
                      </a>
                    </Button>
                    {websiteHref ? (
                      <Button asChild size="sm" variant="outline" className="business-action-button h-9">
                        <a href={websiteHref} target="_blank" rel="noreferrer">
                          <Globe2 className="size-4" />
                          <span className="reference-action-label">Website</span>
                        </a>
                      </Button>
                    ) : shop.ownerId ? (
                      <Button asChild size="sm" variant="outline" className="business-action-button h-9">
                        <Link href={`/messages/${shop.ownerId}`}>
                          <Mail className="size-4" />
                          <span className="reference-action-label">Message</span>
                        </Link>
                      </Button>
                    ) : (
                      <Button asChild size="sm" variant="outline" className="business-action-button h-9">
                        <a href={`mailto:${shop.contactEmail ?? ""}`}>
                          <Mail className="size-4" />
                          <span className="reference-action-label">Email</span>
                        </a>
                      </Button>
                    )}
                  </div>
                </article>
              );
            })}
            {Array.from({ length: (4 - (filtered.length % 4)) % 4 }).map((_, index) => (
              <article key={`business-cta-${index}`} className="reference-card flex h-full min-h-[18rem] flex-col justify-between p-4">
                <Store className="size-8 text-[hsl(var(--primary))]" />
                <div>
                  <p className="reference-card-title">Grow your business</p>
                  <p className="mt-2 text-sm font-semibold leading-6 text-[hsl(var(--muted-foreground))]">
                    Add your services, location, calls, WhatsApp, and website.
                  </p>
                </div>
                <Button asChild className="reference-primary-action">
                  <Link href="/seller/shop">
                    <Store className="size-4" />
                    List business
                  </Link>
                </Button>
              </article>
            ))}
          </>
        ) : (
          <div className="reference-card p-8 text-center text-sm text-[hsl(var(--muted-foreground))] md:col-span-4">
            No published businesses match this search yet.
          </div>
        )}
      </div>
    </div>
  );
}

export function JobAdminConsole({ initialJobs = [] }: { initialJobs?: PublicJobPost[] }) {
  const [jobs, setJobs] = useState(initialJobs);
  const [message, setMessage] = useState("");
  const [uploadingField, setUploadingField] = useState("");
  const emptyJobForm = {
    title: "AI Workflow Specialist",
    companyName: "MR Creativist",
    companyLogo: "/icons/logo.png",
    location: "Remote",
    workplaceType: "Remote",
    employmentType: "Contract",
    salaryMin: "500",
    salaryMax: "1500",
    currency: "USD",
    category: "AI Tools",
    description: "Create AI workflows, prompt systems, content automation and operational documentation for client projects.",
    responsibilities: "Design AI workflows\nDocument repeatable systems\nSupport clients during launch",
    requirements: "Strong AI workflow portfolio\nClear communication\nAbility to ship production-ready assets",
    benefits: "Remote collaboration\nFeatured platform profile\nPerformance-based growth",
    skills: "AI workflows\nAutomation\nPrompt engineering\nContent systems",
    applyUrl: "",
    contactEmail: "",
    status: "published"
  };
  const [form, setForm] = useState(emptyJobForm);
  const [editingJobId, setEditingJobId] = useState<string | null>(null);

  function update(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function startEdit(job: PublicJobPost) {
    setEditingJobId(String(job.id ?? job.slug));
    setForm({
      title: job.title,
      companyName: job.companyName,
      companyLogo: job.companyLogo ?? "/icons/logo.png",
      location: job.location,
      workplaceType: job.workplaceType,
      employmentType: job.employmentType,
      salaryMin: String(job.salaryMin ?? ""),
      salaryMax: String(job.salaryMax ?? ""),
      currency: job.currency ?? "USD",
      category: job.category,
      description: job.description,
      responsibilities: (job.responsibilities ?? []).join("\n"),
      requirements: (job.requirements ?? []).join("\n"),
      benefits: (job.benefits ?? []).join("\n"),
      skills: (job.skills ?? []).join("\n"),
      applyUrl: job.applyUrl ?? "",
      contactEmail: job.contactEmail ?? "",
      status: job.status ?? "published"
    });
    setMessage(`Editing ${job.title}.`);
  }

  function resetForm() {
    setEditingJobId(null);
    setForm(emptyJobForm);
    setMessage("");
  }

  async function uploadJobImage(file: File | null) {
    if (!file) return;

    setUploadingField("companyLogo");
    setMessage("Uploading company image...");

    try {
      const formData = new FormData();
      formData.set("file", file);
      formData.set("kind", "image");
      formData.set("ownerType", "general");
      formData.set("metadata", JSON.stringify({ module: "jobs" }));

      const response = await fetch("/api/upload", { method: "POST", body: formData });
      const payload = await response.json();

      if (!response.ok) throw new Error(payload.error ?? "Image upload failed.");

      const imageUrl = payload.asset?.secureUrl ?? payload.asset?.url;
      if (!imageUrl) throw new Error("Image upload did not return a usable URL.");

      update("companyLogo", imageUrl);
      setMessage("Company image attached.");
      toast.success("Company image uploaded successfully.");
    } catch (error) {
      const nextMessage = error instanceof Error ? error.message : "Image upload failed.";
      setMessage(nextMessage);
      toast.error(nextMessage);
    } finally {
      setUploadingField("");
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(editingJobId ? "Saving job..." : "Publishing job...");

    try {
      const response = await fetch(editingJobId ? `/api/jobs/${editingJobId}` : "/api/jobs", {
        method: editingJobId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          salaryMin: Number(form.salaryMin) || 0,
          salaryMax: Number(form.salaryMax) || 0,
          responsibilities: splitList(form.responsibilities),
          requirements: splitList(form.requirements),
          benefits: splitList(form.benefits),
          skills: splitList(form.skills),
          isFeatured: true
        })
      });
      const payload = await response.json();

      if (!response.ok) throw new Error(payload.error ?? "Job save failed.");

      setJobs((current) =>
        editingJobId
          ? current.map((job) => (String(job.id ?? job.slug) === editingJobId ? payload : job))
          : [payload, ...current]
      );
      setEditingJobId(null);
      const nextMessage = editingJobId ? "Job updated on the public jobs page." : "Job published to the public jobs page.";
      setMessage(nextMessage);
      toast.success(nextMessage);
    } catch (error) {
      const nextMessage = error instanceof Error ? error.message : "Job save failed.";
      setMessage(nextMessage);
      toast.error(nextMessage);
    }
  }

  async function deleteJob(job: PublicJobPost) {
    const recordId = String(job.id ?? job.slug);
    if (!window.confirm(`Delete ${job.title} from the public jobs page?`)) return;

    setMessage("Deleting job...");

    try {
      const response = await fetch(`/api/jobs/${recordId}`, { method: "DELETE" });
      const payload = await response.json();

      if (!response.ok) throw new Error(payload.error ?? "Job delete failed.");

      setJobs((current) => current.filter((item) => String(item.id ?? item.slug) !== recordId));
      if (editingJobId === recordId) resetForm();
      setMessage("Job removed from the public jobs page.");
      toast.success("Job archived successfully.");
    } catch (error) {
      const nextMessage = error instanceof Error ? error.message : "Job delete failed.";
      setMessage(nextMessage);
      toast.error(nextMessage);
    }
  }

  function shareJob(job: PublicJobPost) {
    const text = `${job.title} at ${job.companyName} - ${window.location.origin}/jobs`;
    void navigator.clipboard?.writeText(text);
    setMessage("Job share summary copied.");
    toast.success("Job share summary copied.");
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BriefcaseBusiness className="size-5 text-[hsl(var(--primary))]" />
              {editingJobId ? "Edit job post" : "Create job post"}
            </CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4" onSubmit={submit}>
            <div className="grid gap-4 md:grid-cols-2">
              <Input value={form.title} onChange={(event) => update("title", event.target.value)} placeholder="Job title" />
              <Input value={form.companyName} onChange={(event) => update("companyName", event.target.value)} placeholder="Company" />
              <Input value={form.companyLogo} onChange={(event) => update("companyLogo", event.target.value)} placeholder="Company image URL" />
              <label className="flex h-10 cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-[hsl(var(--border))] px-3 text-sm font-semibold text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]/40">
                {uploadingField === "companyLogo" ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
                Upload company image
                <input
                  type="file"
                  accept="image/*"
                  disabled={uploadingField === "companyLogo"}
                  className="sr-only"
                  onChange={(event) => void uploadJobImage(event.target.files?.[0] ?? null)}
                />
              </label>
              <Input value={form.location} onChange={(event) => update("location", event.target.value)} placeholder="Location" />
              <Input value={form.category} onChange={(event) => update("category", event.target.value)} placeholder="Category" />
              <select value={form.workplaceType} onChange={(event) => update("workplaceType", event.target.value)} className="h-10 rounded-md border border-[hsl(var(--border))] bg-transparent px-3">
                {["Remote", "Hybrid", "On-site"].map((item) => <option key={item}>{item}</option>)}
              </select>
              <select value={form.employmentType} onChange={(event) => update("employmentType", event.target.value)} className="h-10 rounded-md border border-[hsl(var(--border))] bg-transparent px-3">
                {["Full-time", "Part-time", "Contract", "Internship", "Freelance"].map((item) => <option key={item}>{item}</option>)}
              </select>
              <Input value={form.salaryMin} onChange={(event) => update("salaryMin", event.target.value)} inputMode="numeric" placeholder="Salary min" />
              <Input value={form.salaryMax} onChange={(event) => update("salaryMax", event.target.value)} inputMode="numeric" placeholder="Salary max" />
              <Input value={form.applyUrl} onChange={(event) => update("applyUrl", event.target.value)} placeholder="External apply URL (optional)" />
              <Input value={form.contactEmail} onChange={(event) => update("contactEmail", event.target.value)} placeholder="Contact email" />
            </div>
            <textarea value={form.description} onChange={(event) => update("description", event.target.value)} className="min-h-28 rounded-md border border-[hsl(var(--border))] bg-transparent p-3" placeholder="Job description" />
            <textarea value={form.responsibilities} onChange={(event) => update("responsibilities", event.target.value)} className="min-h-24 rounded-md border border-[hsl(var(--border))] bg-transparent p-3" placeholder="Responsibilities, one per line" />
            <textarea value={form.requirements} onChange={(event) => update("requirements", event.target.value)} className="min-h-24 rounded-md border border-[hsl(var(--border))] bg-transparent p-3" placeholder="Requirements, one per line" />
            <textarea value={form.benefits} onChange={(event) => update("benefits", event.target.value)} className="min-h-20 rounded-md border border-[hsl(var(--border))] bg-transparent p-3" placeholder="Benefits, one per line" />
            <textarea value={form.skills} onChange={(event) => update("skills", event.target.value)} className="min-h-20 rounded-md border border-[hsl(var(--border))] bg-transparent p-3" placeholder="Skills, one per line" />
            <div className="flex flex-wrap gap-2">
              <Button type="submit">
                <Send className="size-4" />
                {editingJobId ? "Save job" : "Publish job"}
              </Button>
              {editingJobId ? (
                <Button type="button" variant="outline" onClick={resetForm}>
                  <X className="size-4" />
                  Cancel edit
                </Button>
              ) : null}
            </div>
            {message ? <p className="text-sm text-[hsl(var(--muted-foreground))]">{message}</p> : null}
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Job records</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          {jobs.map((job) => (
            <div key={job.slug} className="rounded-md border border-[hsl(var(--border))] p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{job.title}</p>
                  <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">{job.companyName} - {job.location}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className={statusTone(job.status)}>{job.status ?? "draft"}</Badge>
                  <Button size="sm" variant="outline" onClick={() => startEdit(job)}>
                    <Pencil className="size-4" />
                    Edit
                  </Button>
                  <Button asChild size="sm" variant="outline">
                    <Link href="/jobs" target="_blank">
                      <ExternalLink className="size-4" />
                      View
                    </Link>
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => shareJob(job)}>
                    <Share2 className="size-4" />
                    Share
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => void deleteJob(job)}>
                    <Trash2 className="size-4" />
                    Archive
                  </Button>
                </div>
              </div>
            </div>
          ))}
          {jobs.length === 0 ? <p className="text-sm text-[hsl(var(--muted-foreground))]">No job records yet.</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}

export function ShopBuilder({ initialShops = [], sellerName = "MR Creativist Seller" }: { initialShops?: PublicShopProfile[]; sellerName?: string }) {
  const [shops, setShops] = useState(initialShops);
  const [message, setMessage] = useState("");
  const [uploadingImageField, setUploadingImageField] = useState<"logo" | "coverImage" | "">("");
  const emptyShopForm = {
    name: `${sellerName} Business`,
    tagline: "Digital products, creative services and AI-ready business support.",
    description: "A professional MR Creativist business listing for products, services, templates and creative support.",
    category: "Creative Services",
    logo: "/icons/logo.png",
    coverImage: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1200&q=85",
    contactName: sellerName,
    contactEmail: "",
    phone: "",
    whatsapp: "",
    website: "",
    address: "",
    city: "Kigali",
    country: "Rwanda",
    openingHours: "Monday to Friday, 9:00 - 17:00",
    tags: "AI tools\nDesign\nDigital products\nServices",
    offers: "Brand identity kit|Service|250|USD|Logo, colors, social templates and handoff files|https://images.unsplash.com/photo-1523726491678-bf852e717f6a?auto=format&fit=crop&w=600&q=85\nAI prompt pack|Product|49|USD|Reusable prompts for content, products and workflows|https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=600&q=85",
    status: "submitted"
  };
  const [form, setForm] = useState(emptyShopForm);
  const [editingShopId, setEditingShopId] = useState<string | null>(null);

  function update(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function offersToText(shop: PublicShopProfile) {
    return (shop.productsOrServices ?? [])
      .map((offer) => [offer.name, offer.type, offer.price ?? 0, offer.currency ?? "USD", offer.description ?? "", offer.image ?? ""].join("|"))
      .join("\n");
  }

  function startEdit(shop: PublicShopProfile) {
    setEditingShopId(String(shop.id ?? shop.slug));
    setForm({
      name: shop.name,
      tagline: shop.tagline ?? "",
      description: shop.description,
      category: shop.category,
      logo: shop.logo ?? "/icons/logo.png",
      coverImage: shop.coverImage ?? "",
      contactName: shop.contactName ?? "",
      contactEmail: shop.contactEmail ?? "",
      phone: shop.phone ?? "",
      whatsapp: shop.whatsapp ?? "",
      website: shop.website ?? "",
      address: shop.address ?? "",
      city: shop.city ?? "",
      country: shop.country ?? "",
      openingHours: shop.openingHours ?? "",
      tags: (shop.tags ?? []).join("\n"),
      offers: offersToText(shop),
      status: shop.status ?? "submitted"
    });
    setMessage(`Editing ${shop.name}.`);
  }

  function resetForm() {
    setEditingShopId(null);
    setForm(emptyShopForm);
    setMessage("");
  }

  async function uploadShopImage(field: "logo" | "coverImage", file: File | null) {
    if (!file) return;

    setUploadingImageField(field);
    setMessage("Uploading business image...");

    try {
      const formData = new FormData();
      formData.set("file", file);
      formData.set("kind", "image");
      formData.set("ownerType", "general");
      formData.set("metadata", JSON.stringify({ module: "businesses", field }));

      const response = await fetch("/api/upload", { method: "POST", body: formData });
      const payload = await response.json();

      if (!response.ok) throw new Error(payload.error ?? "Image upload failed.");

      const imageUrl = payload.asset?.secureUrl ?? payload.asset?.url;
      if (!imageUrl) throw new Error("Image upload did not return a usable URL.");

      update(field, imageUrl);
      setMessage("Business image attached.");
      toast.success("Business image uploaded successfully.");
    } catch (error) {
      const nextMessage = error instanceof Error ? error.message : "Image upload failed.";
      setMessage(nextMessage);
      toast.error(nextMessage);
    } finally {
      setUploadingImageField("");
    }
  }

  function offersFromText(value: string) {
    return value
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [name, type, price, currency, description, image] = line.split("|").map((item) => item?.trim() ?? "");
        return {
          name,
          type: type === "Service" ? "Service" : "Product",
          price: Number(price) || 0,
          currency: currency === "FRW" ? "FRW" : "USD",
          description,
          image
        };
      })
      .filter((offer) => offer.name);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(editingShopId ? "Saving business..." : "Submitting business for admin review...");

    try {
      const response = await fetch(editingShopId ? `/api/shops/${editingShopId}` : "/api/shops", {
        method: editingShopId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          tags: splitList(form.tags),
          productsOrServices: offersFromText(form.offers),
          isFeatured: true
        })
      });
      const payload = await response.json();

      if (!response.ok) throw new Error(payload.error ?? "Business save failed.");

      setShops((current) =>
        editingShopId
          ? current.map((shop) => (String(shop.id ?? shop.slug) === editingShopId ? payload : shop))
          : [payload, ...current]
      );
      setEditingShopId(null);
      const nextMessage = editingShopId ? "Business updated and returned to review." : "Business submitted. Admin can approve, verify, and publish it.";
      setMessage(nextMessage);
      toast.success(nextMessage);
    } catch (error) {
      const nextMessage = error instanceof Error ? error.message : "Business save failed.";
      setMessage(nextMessage);
      toast.error(nextMessage);
    }
  }

  async function deleteShop(shop: PublicShopProfile) {
    const recordId = String(shop.id ?? shop.slug);
    if (!window.confirm(`Delete ${shop.name} from the public business page?`)) return;

    setMessage("Deleting business...");

    try {
      const response = await fetch(`/api/shops/${recordId}`, { method: "DELETE" });
      const payload = await response.json();

      if (!response.ok) throw new Error(payload.error ?? "Business delete failed.");

      setShops((current) => current.filter((item) => String(item.id ?? item.slug) !== recordId));
      if (editingShopId === recordId) resetForm();
      setMessage("Business removed from the public business page.");
      toast.success("Business archived successfully.");
    } catch (error) {
      const nextMessage = error instanceof Error ? error.message : "Business delete failed.";
      setMessage(nextMessage);
      toast.error(nextMessage);
    }
  }

  function shareShop(shop: PublicShopProfile) {
    const text = `${shop.name} - ${window.location.origin}/business-directory`;
    void navigator.clipboard?.writeText(text);
    setMessage("Business share summary copied.");
    toast.success("Business share summary copied.");
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="size-5 text-[hsl(var(--primary))]" />
              {editingShopId ? "Edit business" : "List your business"}
            </CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4" onSubmit={submit}>
            <div className="grid gap-4 md:grid-cols-2">
              <Input value={form.name} onChange={(event) => update("name", event.target.value)} placeholder="Business name" />
              <Input value={form.category} onChange={(event) => update("category", event.target.value)} placeholder="Category" />
              <Input value={form.contactName} onChange={(event) => update("contactName", event.target.value)} placeholder="Contact name" />
              <Input value={form.contactEmail} onChange={(event) => update("contactEmail", event.target.value)} placeholder="Contact email" />
              <Input value={form.phone} onChange={(event) => update("phone", event.target.value)} placeholder="Telephone" />
              <Input value={form.whatsapp} onChange={(event) => update("whatsapp", event.target.value)} placeholder="WhatsApp" />
              <Input value={form.city} onChange={(event) => update("city", event.target.value)} placeholder="City" />
              <Input value={form.country} onChange={(event) => update("country", event.target.value)} placeholder="Country" />
              <Input value={form.website} onChange={(event) => update("website", event.target.value)} placeholder="Website" />
              <Input value={form.address} onChange={(event) => update("address", event.target.value)} placeholder="Business address" />
              <Input value={form.openingHours} onChange={(event) => update("openingHours", event.target.value)} placeholder="Working hours" />
              <Input value={form.logo} onChange={(event) => update("logo", event.target.value)} placeholder="Logo URL" />
              <label className="flex h-10 cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-[hsl(var(--border))] px-3 text-sm font-semibold text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]/40">
                {uploadingImageField === "logo" ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
                Upload logo
                <input
                  type="file"
                  accept="image/*"
                  disabled={uploadingImageField === "logo"}
                  className="sr-only"
                  onChange={(event) => void uploadShopImage("logo", event.target.files?.[0] ?? null)}
                />
              </label>
            </div>
            <Input value={form.coverImage} onChange={(event) => update("coverImage", event.target.value)} placeholder="Cover image URL" />
            <label className="flex h-10 cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-[hsl(var(--border))] px-3 text-sm font-semibold text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]/40">
              {uploadingImageField === "coverImage" ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
              Upload cover image
              <input
                type="file"
                accept="image/*"
                disabled={uploadingImageField === "coverImage"}
                className="sr-only"
                onChange={(event) => void uploadShopImage("coverImage", event.target.files?.[0] ?? null)}
              />
            </label>
            <Input value={form.tagline} onChange={(event) => update("tagline", event.target.value)} placeholder="Tagline" />
            <textarea value={form.description} onChange={(event) => update("description", event.target.value)} className="min-h-28 rounded-md border border-[hsl(var(--border))] bg-transparent p-3" placeholder="Business description" />
            <textarea value={form.offers} onChange={(event) => update("offers", event.target.value)} className="min-h-28 rounded-md border border-[hsl(var(--border))] bg-transparent p-3" placeholder="name|Product or Service|price|USD or FRW|description|image URL" />
            <textarea value={form.tags} onChange={(event) => update("tags", event.target.value)} className="min-h-20 rounded-md border border-[hsl(var(--border))] bg-transparent p-3" placeholder="Tags, one per line" />
            <div className="flex flex-wrap gap-2">
              <Button type="submit">
                <Save className="size-4" />
                {editingShopId ? "Save business" : "Publish business"}
              </Button>
              {editingShopId ? (
                <Button type="button" variant="outline" onClick={resetForm}>
                  <X className="size-4" />
                  Cancel edit
                </Button>
              ) : null}
            </div>
            {message ? <p className="text-sm text-[hsl(var(--muted-foreground))]">{message}</p> : null}
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
      <CardTitle>Business records</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          {shops.map((shop) => (
            <div key={shop.slug} className="rounded-md border border-[hsl(var(--border))] p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-64 items-center gap-3">
                  <img
                    src={shop.coverImage || shop.logo || emptyShopForm.coverImage}
                    alt={shop.name}
                    className="size-16 rounded-md border border-[hsl(var(--border))] object-cover"
                  />
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{shop.name}</p>
                    <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">{shop.category} - {shop.city || shop.country || "Online"}</p>
                    <p className="mt-1 line-clamp-1 text-xs text-[hsl(var(--muted-foreground))]">{shop.tagline ?? shop.description}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className={statusTone(shop.status)}>{shop.status ?? "draft"}</Badge>
                  <Button size="sm" variant="outline" onClick={() => startEdit(shop)}>
                    <Pencil className="size-4" />
                    Edit
                  </Button>
                  <Button asChild size="sm" variant="outline">
                    <Link href="/business-directory" target="_blank">
                      <ExternalLink className="size-4" />
                      View
                    </Link>
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => shareShop(shop)}>
                    <Share2 className="size-4" />
                    Share
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => void deleteShop(shop)}>
                    <Trash2 className="size-4" />
                    Archive
                  </Button>
                </div>
              </div>
            </div>
          ))}
          {shops.length === 0 ? (
            <div className="rounded-md border border-dashed border-[hsl(var(--border))] p-8 text-center">
              <Sparkles className="mx-auto mb-3 size-6 text-[hsl(var(--primary))]" />
              <p className="text-sm text-[hsl(var(--muted-foreground))]">Create your first business listing and submit it for admin review.</p>
            </div>
          ) : null}
          {message.includes("submitted") ? (
            <div className="rounded-md border border-[hsl(var(--primary))]/30 p-4 text-sm text-[hsl(var(--primary))]">
              <CheckCircle2 className="mr-2 inline size-4" />
              Business is waiting for admin review.
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
