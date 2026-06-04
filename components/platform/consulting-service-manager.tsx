"use client";

import { useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { Archive, CalendarDays, CheckCircle2, Eye, Plus, Save, Send, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PriceDisplay } from "@/components/ui/price-display";
import { SafeImage } from "@/components/ui/safe-image";

type ConsultingServiceRow = {
  id: string;
  title: string;
  slug?: string;
  name?: string;
  expertName: string;
  expertTitle: string;
  description: string;
  hourlyRate: number;
  currency: "USD" | "FRW";
  expertise: string[];
  languages: string[];
  sessionTypes: { label: string; durationMinutes: number; price?: number }[];
  availability: { day: string; slots: string[] }[];
  image?: string;
  heroImage?: string;
  status: string;
  isVerified?: boolean;
  rating?: number;
};

const defaultHero =
  "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=85";

function splitList(value: string) {
  return value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function statusTone(status: string) {
  const normalized = status.toLowerCase();
  if (["published", "approved", "active"].includes(normalized)) return "border-[hsl(var(--primary))]/35 text-[hsl(var(--primary))]";
  if (["draft", "submitted", "changes_requested"].includes(normalized)) return "border-amber-500/40 text-amber-600";
  return "";
}

function servicePayload(form: ReturnType<typeof initialForm>) {
  return {
    title: form.title.trim() || "Consulting service",
    expertName: form.expertName.trim() || "MR Creativist Consultant",
    expertTitle: form.expertTitle.trim() || "Business consultant",
    description:
      form.description.trim() ||
      "Practical consulting service with discovery, planning, implementation guidance, and follow-up support.",
    hourlyRate: Number(form.hourlyRate) || 0,
    currency: form.currency as "USD" | "FRW",
    expertise: splitList(form.expertise).length ? splitList(form.expertise) : ["Business strategy"],
    languages: splitList(form.languages).length ? splitList(form.languages) : ["English"],
    sessionTypes: [
      {
        label: form.sessionLabel.trim() || "Strategy session",
        durationMinutes: Number(form.durationMinutes) || 60,
        price: Number(form.sessionPrice) || Number(form.hourlyRate) || 0
      }
    ],
    availability: [
      {
        day: form.day.trim() || "Monday",
        slots: splitList(form.slots).length ? splitList(form.slots) : ["09:00", "14:00"]
      }
    ],
    rating: 0,
    heroImage: form.heroImage.trim() || defaultHero,
    status: form.status
  };
}

function initialForm(service?: ConsultingServiceRow | null, fallbackName = "MR Creativist Consultant") {
  return {
    title: service?.title ?? "Consulting launch package",
    expertName: service?.expertName ?? service?.name ?? fallbackName,
    expertTitle: service?.expertTitle ?? "Creative business consultant",
    description:
      service?.description ??
      "Book practical consulting for business positioning, creator operations, marketplace setup, and launch planning.",
    hourlyRate: String(service?.hourlyRate ?? 45),
    currency: service?.currency ?? "USD",
    expertise: (service?.expertise ?? ["Business strategy", "Course launches", "Marketplace operations"]).join("\n"),
    languages: (service?.languages ?? ["English", "Kinyarwanda"]).join("\n"),
    sessionLabel: service?.sessionTypes?.[0]?.label ?? "Strategy call",
    durationMinutes: String(service?.sessionTypes?.[0]?.durationMinutes ?? 60),
    sessionPrice: String(service?.sessionTypes?.[0]?.price ?? service?.hourlyRate ?? 45),
    day: service?.availability?.[0]?.day ?? "Monday",
    slots: (service?.availability?.[0]?.slots ?? ["09:00", "14:00"]).join("\n"),
    heroImage: service?.heroImage ?? service?.image ?? defaultHero,
    status: service?.status ?? "published"
  };
}

export function ConsultingServiceManager({
  ownerName,
  initialServices = []
}: {
  ownerName: string;
  initialServices?: ConsultingServiceRow[];
}) {
  const [services, setServices] = useState(initialServices);
  const [selectedId, setSelectedId] = useState(initialServices[0]?.id ?? "new");
  const selectedService = services.find((service) => service.id === selectedId) ?? null;
  const [form, setForm] = useState(() => initialForm(selectedService, ownerName));
  const [busy, setBusy] = useState("");
  const publishedCount = services.filter((service) => service.status === "published").length;
  const avgRate = services.length
    ? Math.round(services.reduce((total, service) => total + Number(service.hourlyRate ?? 0), 0) / services.length)
    : Number(form.hourlyRate) || 0;

  const selectedPreview = useMemo(() => servicePayload(form), [form]);

  function selectService(service: ConsultingServiceRow | null) {
    setSelectedId(service?.id ?? "new");
    setForm(initialForm(service, ownerName));
  }

  async function saveService(event?: FormEvent<HTMLFormElement>, nextStatus?: string) {
    event?.preventDefault();
    const isUpdate = selectedService && selectedId !== "new";
    const body = { ...servicePayload(form), status: nextStatus ?? form.status };
    setBusy(nextStatus ?? "save");

    try {
      const response = await fetch(isUpdate ? `/api/consulting/${encodeURIComponent(selectedService.id)}` : "/api/consulting", {
        method: isUpdate ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const payload = await response.json();
      if (!response.ok || payload.error) throw new Error(payload.error ?? "Consulting service could not be saved.");

      const normalized = {
        ...payload,
        id: String(payload.id ?? payload._id ?? selectedService?.id),
        expertName: payload.name ?? payload.expertName ?? body.expertName,
        heroImage: payload.heroImage ?? payload.image ?? body.heroImage
      };
      setServices((current) =>
        isUpdate ? current.map((service) => (service.id === normalized.id ? normalized : service)) : [normalized, ...current]
      );
      setSelectedId(normalized.id);
      setForm(initialForm(normalized, ownerName));
      toast.success(nextStatus === "archived" ? "Consulting service archived." : "Consulting service saved.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Consulting service could not be saved.");
    } finally {
      setBusy("");
    }
  }

  async function archiveSelected() {
    if (!selectedService) return;
    setBusy("archive");
    try {
      const response = await fetch(`/api/consulting/${encodeURIComponent(selectedService.id)}`, { method: "DELETE" });
      const payload = await response.json();
      if (!response.ok || payload.error) throw new Error(payload.error ?? "Archive failed.");

      setServices((current) => current.map((service) => (service.id === selectedService.id ? { ...service, status: "archived" } : service)));
      toast.success("Consulting service archived.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Archive failed.");
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.18em] text-[hsl(var(--primary))]">Consulting studio</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Manage consulting</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[hsl(var(--muted-foreground))]">
            Publish service packages, hourly rates, availability, booking types, and public consultant positioning.
          </p>
        </div>
        <Button onClick={() => selectService(null)}>
          <Plus className="size-4" />
          New service
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: "Services", value: services.length },
          { label: "Published", value: publishedCount },
          { label: "Average rate", value: `${form.currency} ${avgRate}` },
          { label: "Booking slots", value: splitList(form.slots).length }
        ].map((metric) => (
          <Card key={metric.label}>
            <CardContent className="p-4">
              <Sparkles className="mb-3 size-5 text-[hsl(var(--primary))]" />
              <p className="text-sm text-[hsl(var(--muted-foreground))]">{metric.label}</p>
              <p className="mt-1 text-2xl font-black">{metric.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <section className="grid gap-5 xl:grid-cols-[20rem_1fr_22rem]">
        <Card className="h-max">
          <CardHeader>
            <CardTitle>Your services</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            {services.map((service) => (
              <button
                key={service.id}
                type="button"
                onClick={() => selectService(service)}
                className={selectedId === service.id ? "rounded-md border border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/10 p-3 text-left" : "rounded-md border border-[hsl(var(--border))] p-3 text-left hover:bg-[hsl(var(--muted))]/45"}
              >
                <p className="font-semibold">{service.title}</p>
                <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">{service.expertTitle}</p>
                <Badge className={`mt-2 ${statusTone(service.status)}`}>{service.status}</Badge>
              </button>
            ))}
            {!services.length ? (
              <div className="rounded-md border border-dashed border-[hsl(var(--border))] p-4 text-sm text-[hsl(var(--muted-foreground))]">
                No consulting services yet. Create and publish the first one.
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{selectedService ? "Edit consulting service" : "Create consulting service"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4 md:grid-cols-2" onSubmit={(event) => void saveService(event)}>
              <label className="grid gap-2 text-sm font-semibold">
                Service title
                <Input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} />
              </label>
              <label className="grid gap-2 text-sm font-semibold">
                Expert title
                <Input value={form.expertTitle} onChange={(event) => setForm((current) => ({ ...current, expertTitle: event.target.value }))} />
              </label>
              <label className="grid gap-2 text-sm font-semibold">
                Expert name
                <Input value={form.expertName} onChange={(event) => setForm((current) => ({ ...current, expertName: event.target.value }))} />
              </label>
              <label className="grid gap-2 text-sm font-semibold">
                Status
                <select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))} className="h-10 rounded-md border border-[hsl(var(--border))] bg-transparent px-3">
                  {["draft", "published", "archived"].map((status) => <option key={status}>{status}</option>)}
                </select>
              </label>
              <label className="grid gap-2 text-sm font-semibold">
                Hourly rate
                <Input value={form.hourlyRate} onChange={(event) => setForm((current) => ({ ...current, hourlyRate: event.target.value }))} inputMode="decimal" />
              </label>
              <label className="grid gap-2 text-sm font-semibold">
                Currency
                <select value={form.currency} onChange={(event) => setForm((current) => ({ ...current, currency: event.target.value as "USD" | "FRW" }))} className="h-10 rounded-md border border-[hsl(var(--border))] bg-transparent px-3">
                  <option>USD</option>
                  <option>FRW</option>
                </select>
              </label>
              <label className="grid gap-2 text-sm font-semibold md:col-span-2">
                Description
                <textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} className="min-h-32 rounded-md border border-[hsl(var(--border))] bg-transparent p-3 text-sm" />
              </label>
              <label className="grid gap-2 text-sm font-semibold">
                Expertise
                <textarea value={form.expertise} onChange={(event) => setForm((current) => ({ ...current, expertise: event.target.value }))} className="min-h-24 rounded-md border border-[hsl(var(--border))] bg-transparent p-3 text-sm" />
              </label>
              <label className="grid gap-2 text-sm font-semibold">
                Languages
                <textarea value={form.languages} onChange={(event) => setForm((current) => ({ ...current, languages: event.target.value }))} className="min-h-24 rounded-md border border-[hsl(var(--border))] bg-transparent p-3 text-sm" />
              </label>
              <label className="grid gap-2 text-sm font-semibold">
                Session label
                <Input value={form.sessionLabel} onChange={(event) => setForm((current) => ({ ...current, sessionLabel: event.target.value }))} />
              </label>
              <label className="grid gap-2 text-sm font-semibold">
                Duration minutes
                <Input value={form.durationMinutes} onChange={(event) => setForm((current) => ({ ...current, durationMinutes: event.target.value }))} inputMode="numeric" />
              </label>
              <label className="grid gap-2 text-sm font-semibold">
                Availability day
                <Input value={form.day} onChange={(event) => setForm((current) => ({ ...current, day: event.target.value }))} />
              </label>
              <label className="grid gap-2 text-sm font-semibold">
                Slots
                <textarea value={form.slots} onChange={(event) => setForm((current) => ({ ...current, slots: event.target.value }))} className="min-h-20 rounded-md border border-[hsl(var(--border))] bg-transparent p-3 text-sm" />
              </label>
              <label className="grid gap-2 text-sm font-semibold md:col-span-2">
                Hero image URL
                <Input value={form.heroImage} onChange={(event) => setForm((current) => ({ ...current, heroImage: event.target.value }))} />
              </label>
              <div className="flex flex-wrap gap-2 md:col-span-2">
                <Button type="submit" disabled={Boolean(busy)}>
                  <Save className="size-4" />
                  Save
                </Button>
                <Button type="button" onClick={() => void saveService(undefined, "published")} disabled={Boolean(busy)}>
                  <Send className="size-4" />
                  Publish
                </Button>
                {selectedService ? (
                  <Button type="button" variant="outline" onClick={() => void archiveSelected()} disabled={Boolean(busy)}>
                    <Archive className="size-4" />
                    Archive
                  </Button>
                ) : null}
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="h-max overflow-hidden">
          <div className="relative aspect-video">
            <SafeImage src={selectedPreview.heroImage} alt={selectedPreview.title} fill sizes="352px" className="object-cover" />
          </div>
          <CardHeader>
            <div className="flex flex-wrap gap-2">
              <Badge className={statusTone(selectedPreview.status)}>{selectedPreview.status}</Badge>
              <Badge>{selectedPreview.sessionTypes[0]?.durationMinutes ?? 60} min</Badge>
            </div>
            <CardTitle>{selectedPreview.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm leading-6 text-[hsl(var(--muted-foreground))]">{selectedPreview.description}</p>
            <PriceDisplay price={`${selectedPreview.currency} ${selectedPreview.hourlyRate}`} className="text-2xl text-[hsl(var(--primary))]" />
            <div className="flex flex-wrap gap-2">
              {selectedPreview.expertise.slice(0, 4).map((item) => <Badge key={item}>{item}</Badge>)}
            </div>
            <div className="grid gap-2">
              {selectedService?.slug ? (
                <Button asChild variant="outline">
                  <Link href={`/consulting/${selectedService.slug}`}>
                    <Eye className="size-4" />
                    Public page
                  </Link>
                </Button>
              ) : null}
              <Button asChild variant="outline">
                <Link href="/dashboard/consulting-bookings">
                  <CalendarDays className="size-4" />
                  Booking records
                </Link>
              </Button>
              <Button type="button" variant="outline" onClick={() => selectService(null)}>
                <Trash2 className="size-4" />
                Clear form
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
