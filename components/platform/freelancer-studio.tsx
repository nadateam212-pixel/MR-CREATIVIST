"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useMemo, useState } from "react";
import {
  BriefcaseBusiness,
  Clock,
  MapPin,
  MessageSquare,
  Search,
  Star,
  Users
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PriceDisplay } from "@/components/ui/price-display";
import { SafeImage } from "@/components/ui/safe-image";
import { VerifiedMark } from "@/components/ui/verified-mark";

type Freelancer = {
  id: string;
  name: string;
  role: string;
  specialty: string;
  location: string;
  rate: number;
  rating: number;
  completed: number;
  responseHours: number;
  availability: number;
  portfolio: number;
  languages: string[];
  skills: string[];
  verified: string[];
  isVerified?: boolean;
  image: string;
};

type PublicGig = {
  id?: string;
  ownerId?: string;
  ownerName?: string;
  ownerAddress?: string;
  ownerCity?: string;
  ownerCountry?: string;
  slug: string;
  title: string;
  category: string;
  packageName: string;
  description: string;
  price: string;
  deliveryDays: number;
  revisions: number;
  image: string;
  tags: string[];
  deliverables: string[];
  rating: number;
  orders: number;
  status?: string;
  isVerified?: boolean;
};

function locationLabel(gig: PublicGig) {
  return [gig.ownerAddress, gig.ownerCity, gig.ownerCountry].filter(Boolean).join(", ") || "Remote";
}

export function FreelancerStudio({
  initialFreelancers = [],
  initialGigs = []
}: {
  initialFreelancers?: Freelancer[];
  initialGigs?: PublicGig[];
}) {
  const router = useRouter();
  const { data: session } = useSession();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [requestingGigSlug, setRequestingGigSlug] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  const publishedGigs = initialGigs.filter((gig) => gig.status === "published");
  const categories = useMemo(
    () => ["All", ...Array.from(new Set([...publishedGigs.map((gig) => gig.category), ...initialFreelancers.map((item) => item.specialty)].filter(Boolean)))],
    [initialFreelancers, publishedGigs]
  );
  const searchTerm = query.trim().toLowerCase();

  const filteredGigs = publishedGigs.filter((gig) => {
    const target = `${gig.title} ${gig.category} ${gig.ownerName ?? ""} ${(gig.tags ?? []).join(" ")}`.toLowerCase();
    return (!searchTerm || target.includes(searchTerm)) && (category === "All" || gig.category === category);
  });

  const filteredFreelancers = initialFreelancers.filter((freelancer) => {
    const target = `${freelancer.name} ${freelancer.role} ${freelancer.specialty} ${freelancer.location} ${(freelancer.skills ?? []).join(" ")}`.toLowerCase();
    return (!searchTerm || target.includes(searchTerm)) && (category === "All" || freelancer.specialty === category);
  });

  async function requestGig(gig: PublicGig) {
    if (!session?.user) {
      router.push(`/login?callbackUrl=/freelancers%23${gig.slug}`);
      return;
    }

    setRequestingGigSlug(gig.slug);
    setStatusMessage("");

    try {
      const response = await fetch("/api/gigs/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ownerId: gig.ownerId,
          ownerName: gig.ownerName ?? "Freelancer",
          gigSlug: gig.slug,
          gigTitle: gig.title,
          gigPrice: gig.price
        })
      });
      const payload = await response.json();

      if (!response.ok) throw new Error(payload.error ?? "Could not request this gig.");

      setStatusMessage("Gig owner notified. Opening chat...");
      router.push(payload.threadUrl ?? "/messages");
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Could not request this gig.");
    } finally {
      setRequestingGigSlug("");
    }
  }

  return (
    <div className="border-y border-[hsl(var(--border))] bg-[hsl(var(--muted))]/25">
      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[hsl(var(--primary))]">Freelancers</p>
            <h1 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">Hire verified talent</h1>
          </div>
          <Button asChild>
            <Link href="/freelancer/gigs">
              <BriefcaseBusiness className="size-4" />
              Create gig
            </Link>
          </Button>
        </div>

        <div className="grid gap-3 lg:grid-cols-[1fr_15rem]">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="h-12 pl-12"
              placeholder="Search gigs, skills, freelancers, or location"
            />
          </div>
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="h-12 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 text-sm font-semibold"
            aria-label="Filter freelancers and gigs by category"
          >
            {categories.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </div>

        {statusMessage ? (
          <p className="mt-4 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3 text-sm font-medium">
            {statusMessage}
          </p>
        ) : null}

        <div className="mt-6 grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-3">
              <div>
                <CardTitle>Gigs</CardTitle>
                <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">Ready-to-request service packages.</p>
              </div>
              <Badge>{filteredGigs.length}</Badge>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              {filteredGigs.length ? (
                filteredGigs.map((gig) => (
                  <article key={gig.slug} id={gig.slug} className="rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-3">
                    <div className="flex gap-3">
                      <span className="relative size-16 shrink-0 overflow-hidden rounded-md bg-slate-950">
                        <SafeImage src={gig.image || "/icons/logo.png"} alt={gig.title} fill sizes="64px" className="object-cover" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="flex min-w-0 items-center gap-1.5 font-black leading-tight">
                          <span className="truncate">{gig.title}</span>
                          {gig.isVerified ? <VerifiedMark label="Verified gig" /> : null}
                        </p>
                        <p className="mt-1 flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.12em] text-[hsl(var(--muted-foreground))]">
                          <span className="truncate">{gig.ownerName ?? "Freelancer"}</span>
                          {gig.isVerified ? <VerifiedMark label="Verified freelancer" className="size-3.5" /> : null}
                        </p>
                        <p className="mt-2 line-clamp-2 text-sm leading-5 text-[hsl(var(--muted-foreground))]">{gig.description}</p>
                      </div>
                    </div>
                    <div className="mt-3 space-y-3">
                      <div className="flex flex-wrap gap-1.5">
                        <Badge>{gig.category}</Badge>
                        <Badge>{gig.deliveryDays} days</Badge>
                        <Badge>{gig.packageName}</Badge>
                      </div>
                      <p className="flex items-center gap-2 text-xs font-semibold text-[hsl(var(--muted-foreground))]">
                        <MapPin className="size-4 text-[hsl(var(--primary))]" />
                        {locationLabel(gig)}
                      </p>
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <PriceDisplay price={gig.price} className="text-xl text-[hsl(var(--primary))]" />
                        <Button size="sm" onClick={() => void requestGig(gig)} disabled={requestingGigSlug === gig.slug}>
                          <MessageSquare className="size-4" />
                          {requestingGigSlug === gig.slug ? "Sending..." : "Request"}
                        </Button>
                      </div>
                    </div>
                  </article>
                ))
              ) : (
                <div className="rounded-md border border-dashed border-[hsl(var(--border))] p-6 text-sm text-[hsl(var(--muted-foreground))] md:col-span-2">
                  No published gigs match this search.
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-3">
              <div>
                <CardTitle>Freelancers</CardTitle>
                <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">Names, skills, rating, and contact access.</p>
              </div>
              <Badge>{filteredFreelancers.length}</Badge>
            </CardHeader>
            <CardContent className="grid gap-3">
              {filteredFreelancers.length ? (
                filteredFreelancers.map((freelancer) => (
                  <article key={freelancer.id} className="rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-3">
                    <div className="flex gap-3">
                      <span className="relative size-16 shrink-0 overflow-hidden rounded-md bg-slate-950">
                        <SafeImage src={freelancer.image || "/icons/logo.png"} alt={freelancer.name} fill sizes="64px" className="object-cover" />
                      </span>
                      <div className="min-w-0 flex-1 space-y-2.5">
                        <div className="min-w-0">
                          <p className="flex min-w-0 items-center gap-1.5 font-black leading-tight text-[hsl(var(--foreground))]">
                            <span className="truncate">{freelancer.name}</span>
                            {freelancer.isVerified ? <VerifiedMark label="Verified freelancer" /> : null}
                          </p>
                          <p className="mt-1 truncate text-xs font-bold uppercase tracking-[0.12em] text-[hsl(var(--muted-foreground))]">{freelancer.role}</p>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          <Badge>{freelancer.specialty}</Badge>
                          <Badge>
                            <Star className="mr-1 size-3 fill-amber-400 text-amber-400" />
                            {Number(freelancer.rating ?? 0).toFixed(1)}
                          </Badge>
                          <Badge>
                            <Users className="mr-1 size-3" />
                            {freelancer.completed ?? 0} jobs
                          </Badge>
                          <Badge>
                            <Clock className="mr-1 size-3" />
                            {freelancer.responseHours ?? 24}h response
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {(freelancer.skills ?? []).slice(0, 4).map((skill) => (
                            <Badge key={`${freelancer.id}-${skill}`} className="border-[hsl(var(--primary))]/45 text-[hsl(var(--primary))]">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <p className="text-sm font-semibold text-[hsl(var(--muted-foreground))]">
                            {freelancer.location} - {freelancer.rate ? `FRW ${Number(freelancer.rate).toLocaleString()} / hour` : "Rate on request"}
                          </p>
                          <Button asChild size="sm" variant="outline">
                            <Link href={`/messages/${freelancer.id}`}>
                              <MessageSquare className="size-4" />
                              Message
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </article>
                ))
              ) : (
                <div className="rounded-md border border-dashed border-[hsl(var(--border))] p-6 text-sm text-[hsl(var(--muted-foreground))]">
                  No freelancers match this search.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
