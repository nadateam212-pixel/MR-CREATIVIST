"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays, Languages, Search, Star, Video, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { VerifiedMark } from "@/components/ui/verified-mark";

type Consultant = {
  id?: string;
  name: string;
  slug: string;
  title: string;
  serviceTitle?: string;
  rate: string;
  rating?: number | string;
  expertise: string[];
  languages?: string[];
  sessionTypes?: { label: string; durationMinutes: number; price?: number }[];
  isVerified?: boolean;
};

export function ConsultingDirectory({ consultants }: { consultants: Consultant[] }) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Consultant | null>(null);
  const [formState, setFormState] = useState({ name: "", email: "", date: "", sessionType: "", notes: "" });
  const [status, setStatus] = useState("");
  const filteredConsultants = useMemo(() => {
    const term = query.trim().toLowerCase();

    if (!term) return consultants;

    return consultants.filter((consultant) =>
      [consultant.name, consultant.title, consultant.serviceTitle, consultant.rate, ...(consultant.expertise ?? [])]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(term)
    );
  }, [consultants, query]);

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setSelected(null);
    }

    window.addEventListener("keydown", closeOnEscape);

    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);

  async function submitBooking(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;

    setStatus("Saving booking...");

    try {
      const response = await fetch("/api/consulting/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId: selected.id ?? selected.slug,
          clientName: formState.name,
          clientEmail: formState.email,
          sessionType: formState.sessionType || selected.sessionTypes?.[0]?.label || "Strategy session",
          scheduledFor: formState.date,
          notes: formState.notes
        })
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error ?? "Booking failed.");
      }

      setStatus("Booking request saved.");
      setFormState({ name: "", email: "", date: "", sessionType: "", notes: "" });
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Booking failed.");
    }
  }

  return (
    <>
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="h-14 pl-12 text-base"
            placeholder="SEARCH CONSULTANTS BY AI, MEDIA, BUSINESS, SELLING OR LANGUAGE"
          />
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          {filteredConsultants.length > 0 ? (
            filteredConsultants.map((consultant) => (
              <Card key={consultant.slug}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-[hsl(var(--primary))]">
                        {consultant.title}
                      </p>
                      <CardTitle className="mt-2 flex flex-wrap items-center gap-2 uppercase">
                        <span>{consultant.name}</span>
                        {consultant.isVerified ? <VerifiedMark label="Verified consultant" /> : null}
                      </CardTitle>
                    </div>
                    <span className="flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-700">
                      <Star className="size-3.5 fill-current" />
                      {consultant.rating ?? "4.8"}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 text-sm font-semibold text-[hsl(var(--muted-foreground))]">
                    <span className="flex items-center gap-2">
                      <CalendarDays className="size-4" />
                      AVAILABLE THIS WEEK
                    </span>
                    <span className="flex items-center gap-2">
                      <Languages className="size-4" />
                      {(consultant.languages ?? ["ENGLISH"]).join(" AND ").toUpperCase()}
                    </span>
                    <span className="flex items-center gap-2">
                      <Video className="size-4" />
                      VIDEO SESSION READY
                    </span>
                  </div>
                  <div className="mt-6 flex items-center justify-between">
                    <p className="text-lg font-black text-[hsl(var(--primary))]">{consultant.rate}</p>
                    <div className="flex gap-2">
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/consulting/${consultant.slug}`}>PROFILE</Link>
                      </Button>
                      <Button size="sm" onClick={() => setSelected(consultant)}>
                        BOOK
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="lg:col-span-3">
              <CardContent className="p-8 text-center">
                <CalendarDays className="mx-auto mb-3 size-8 text-[hsl(var(--primary))]" />
                <h2 className="text-xl font-semibold">No consultants found</h2>
                <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
                  Publish consulting services or adjust your search.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {selected ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="booking-title"
        >
          <Card className="max-h-[90vh] w-full max-w-xl overflow-y-auto">
            <CardHeader className="flex-row items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[hsl(var(--primary))]">Book session</p>
                <CardTitle id="booking-title" className="mt-2">{selected.name}</CardTitle>
              </div>
              <Button type="button" variant="ghost" size="icon" aria-label="Close booking form" onClick={() => setSelected(null)}>
                <X className="size-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <form className="grid gap-4" onSubmit={submitBooking}>
                <div className="grid gap-2">
                  <Label htmlFor="booking-name">Name</Label>
                  <Input id="booking-name" required value={formState.name} onChange={(event) => setFormState((current) => ({ ...current, name: event.target.value }))} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="booking-email">Email</Label>
                  <Input id="booking-email" required type="email" value={formState.email} onChange={(event) => setFormState((current) => ({ ...current, email: event.target.value }))} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="booking-session">Session type</Label>
                  <select
                    id="booking-session"
                    value={formState.sessionType}
                    onChange={(event) => setFormState((current) => ({ ...current, sessionType: event.target.value }))}
                    className="h-10 rounded-md border border-[hsl(var(--border))] bg-transparent px-3 text-sm"
                  >
                    {(selected.sessionTypes?.length ? selected.sessionTypes : [{ label: "Strategy session", durationMinutes: 60 }]).map((session) => (
                      <option key={session.label} value={session.label}>
                        {session.label} - {session.durationMinutes} min
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="booking-date">Preferred time</Label>
                  <Input id="booking-date" required type="datetime-local" value={formState.date} onChange={(event) => setFormState((current) => ({ ...current, date: event.target.value }))} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="booking-notes">Notes</Label>
                  <textarea
                    id="booking-notes"
                    rows={4}
                    value={formState.notes}
                    onChange={(event) => setFormState((current) => ({ ...current, notes: event.target.value }))}
                    className="w-full rounded-md border border-[hsl(var(--input))] bg-transparent px-3 py-3 text-sm outline-none transition-colors placeholder:text-[hsl(var(--muted-foreground))] focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
                  />
                </div>
                {status ? <p className="text-sm font-medium text-[hsl(var(--primary))]">{status}</p> : null}
                <Button type="submit">Request booking</Button>
              </form>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </>
  );
}
