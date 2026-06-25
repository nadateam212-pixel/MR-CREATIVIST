"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  BriefcaseBusiness,
  Clock,
  MapPin,
  MessageSquare,
  PackageCheck,
  Search,
  SlidersHorizontal,
  Star,
  Users
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PriceDisplay } from "@/components/ui/price-display";
import { SafeImage } from "@/components/ui/safe-image";
import { VerifiedMark } from "@/components/ui/verified-mark";

type Freelancer = {
  id: string;
  profileId?: string;
  slug?: string;
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
  ownerImage?: string;
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

function freelancerHref(freelancer: Freelancer) {
  return `/freelancers/${freelancer.slug ?? freelancer.profileId ?? freelancer.id}`;
}

function rateLabel(rate: number) {
  const numeric = Number(rate ?? 0);
  return numeric > 0 ? `FRW ${numeric.toLocaleString("en")}/hr` : "Rate on request";
}

function gigLocation(gig: PublicGig) {
  return [gig.ownerAddress, gig.ownerCity, gig.ownerCountry].filter(Boolean).join(", ") || "Remote";
}

function DirectoryFillCard({ kind, index }: { kind: "freelancers" | "gigs"; index: number }) {
  const isGigs = kind === "gigs";
  const Icon = isGigs ? PackageCheck : Users;
  const title = isGigs ? "Create a gig" : "Build your profile";
  const body = isGigs ? "Package your service and get discovered by buyers." : "Join the directory and appear beside top talent.";
  const href = isGigs ? "/freelancer/gigs" : "/profile";

  return (
    <Link href={href} className="reference-card flex min-h-[18.5rem] flex-col justify-between p-4 transition-colors hover:bg-[hsl(var(--muted))]/35">
      <span className="grid size-11 place-items-center rounded-md bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))]">
        <Icon className="size-5" />
      </span>
      <div>
        <p className="reference-card-title">{title}</p>
        <p className="mt-2 text-sm font-semibold leading-6 text-[hsl(var(--muted-foreground))]">{body}</p>
      </div>
      <Button className="reference-primary-action pointer-events-none h-9 w-full" tabIndex={-1}>
        {index % 2 === 0 ? "Start now" : "Open tools"}
      </Button>
    </Link>
  );
}

export function FreelancerStudio({
  initialFreelancers = [],
  initialGigs = []
}: {
  initialFreelancers?: Freelancer[];
  initialGigs?: PublicGig[];
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [activeView, setActiveView] = useState<"freelancers" | "gigs">("freelancers");
  const publishedGigs = useMemo(() => initialGigs.filter((gig) => gig.status === "published"), [initialGigs]);
  const categories = useMemo(() => {
    const values =
      activeView === "freelancers"
        ? initialFreelancers.map((item) => item.specialty)
        : publishedGigs.map((item) => item.category);
    return ["All", ...Array.from(new Set(values.filter(Boolean)))];
  }, [activeView, initialFreelancers, publishedGigs]);
  const searchTerm = query.trim().toLowerCase();

  const filteredFreelancers = initialFreelancers.filter((freelancer) => {
    const target = `${freelancer.name} ${freelancer.role} ${freelancer.specialty} ${freelancer.location} ${(freelancer.skills ?? []).join(" ")}`.toLowerCase();
    return (!searchTerm || target.includes(searchTerm)) && (category === "All" || freelancer.specialty === category);
  });

  const filteredGigs = publishedGigs.filter((gig) => {
    const target = `${gig.title} ${gig.category} ${gig.packageName} ${gig.ownerName ?? ""} ${(gig.tags ?? []).join(" ")}`.toLowerCase();
    return (!searchTerm || target.includes(searchTerm)) && (category === "All" || gig.category === category);
  });
  const freelancerFillerCount = filteredFreelancers.length ? (4 - (filteredFreelancers.length % 4)) % 4 : 0;
  const gigFillerCount = filteredGigs.length ? (4 - (filteredGigs.length % 4)) % 4 : 0;

  function switchView(view: "freelancers" | "gigs") {
    setActiveView(view);
    setCategory("All");
  }

  return (
    <div className="border-y border-[hsl(var(--border))] bg-[hsl(var(--muted))]/25">
      <section className="app-frame py-6">
        <div className="mb-4 flex flex-col gap-3 text-[hsl(var(--foreground))] sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
              Hire <span className="text-[hsl(var(--primary))]">Top</span> Freelancers
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant={activeView === "freelancers" ? "default" : "outline"}
              onClick={() => switchView("freelancers")}
              className="h-10"
            >
              <Users className="size-4" />
              Freelancers
            </Button>
            <Button
              type="button"
              variant={activeView === "gigs" ? "default" : "outline"}
              onClick={() => switchView("gigs")}
              className="h-10"
            >
              <PackageCheck className="size-4" />
              Gigs
            </Button>
            <Button asChild className="h-10">
              <Link href="/freelancer/gigs">
                <BriefcaseBusiness className="size-4" />
                Create gig
              </Link>
            </Button>
          </div>
        </div>

        <div className="reference-toolbar">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="h-10 bg-[hsl(var(--card))] pl-10 text-sm font-semibold"
              placeholder={activeView === "freelancers" ? "Search freelancers, skills, or location" : "Search gigs, packages, or skills"}
            />
          </div>
          <div className="reference-filter-row">
            {categories.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setCategory(item)}
                className={`reference-filter-chip ${category === item ? "reference-filter-chip-active" : ""}`}
              >
                {item}
              </button>
            ))}
          </div>
          <Button variant="outline" className="hidden h-10 bg-[hsl(var(--card))] lg:inline-flex">
            <SlidersHorizontal className="size-4" />
            Filters
          </Button>
        </div>

        {activeView === "freelancers" ? (
          <div className="reference-grid-4 mt-4">
            {filteredFreelancers.length ? (
              <>
                {filteredFreelancers.map((freelancer) => (
                  <article key={freelancer.id ?? freelancer.slug} className="reference-card flex min-h-[18.5rem] flex-col p-3">
                    <div className="flex items-start gap-3">
                      <Link href={freelancerHref(freelancer)} className="relative size-16 shrink-0 overflow-hidden rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--muted))]">
                        <SafeImage src={freelancer.image || "/icons/logo.png"} alt={freelancer.name} fill sizes="64px" className="object-cover" />
                      </Link>
                      <div className="min-w-0 flex-1">
                        <p className="flex min-w-0 items-center gap-1.5 font-black leading-tight">
                          <Link href={freelancerHref(freelancer)} className="truncate hover:text-[hsl(var(--primary))]">
                            {freelancer.name}
                          </Link>
                          {freelancer.isVerified ? <VerifiedMark label="Verified freelancer" className="size-3.5" /> : null}
                        </p>
                        <p className="mt-1 line-clamp-2 min-h-8 text-xs font-semibold text-[hsl(var(--muted-foreground))]">{freelancer.role}</p>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-1.5">
                      <Badge>{freelancer.specialty}</Badge>
                      {(freelancer.skills ?? []).slice(0, 3).map((skill) => (
                        <Badge key={`${freelancer.id}-${skill}`}>{skill}</Badge>
                      ))}
                    </div>

                    <div className="mt-auto grid gap-2 pt-4 text-xs font-semibold text-[hsl(var(--muted-foreground))]">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-black text-[hsl(var(--success))]">{rateLabel(freelancer.rate)}</span>
                        <span className="flex items-center gap-1 text-[hsl(var(--foreground))]">
                          <Star className="size-3.5 fill-amber-400 text-amber-400" />
                          {Number(freelancer.rating ?? 0).toFixed(1)} ({freelancer.completed ?? 0})
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <span className="flex items-center gap-1.5">
                          <Clock className="size-3.5 text-[hsl(var(--primary))]" />
                          {freelancer.responseHours ?? 24}h
                        </span>
                        <span className="flex items-center gap-1.5">
                          <BriefcaseBusiness className="size-3.5 text-[hsl(var(--primary))]" />
                          {freelancer.completed ?? 0} jobs
                        </span>
                      </div>
                      <p className="flex items-center gap-1.5">
                        <MapPin className="size-3.5 text-[hsl(var(--primary))]" />
                        <span className="line-clamp-1">{freelancer.location || "Remote"}</span>
                      </p>
                      <Button asChild className="mt-1 h-9 w-full reference-primary-action">
                        <Link href={freelancer.id ? `/messages/${freelancer.id}` : freelancerHref(freelancer)}>
                          <BriefcaseBusiness className="size-4" />
                          Hire
                        </Link>
                      </Button>
                    </div>
                  </article>
                ))}
                {Array.from({ length: freelancerFillerCount }).map((_, index) => (
                  <DirectoryFillCard key={`freelancer-fill-${index}`} kind="freelancers" index={index} />
                ))}
              </>
            ) : (
              <div className="reference-card p-8 text-center text-sm text-[hsl(var(--muted-foreground))] md:col-span-4">
                No freelancers match this search.
              </div>
            )}
          </div>
        ) : (
          <div className="reference-grid-4 mt-4">
            {filteredGigs.length ? (
              <>
                {filteredGigs.map((gig) => (
                  <article key={gig.slug} className="reference-card flex min-h-[22rem] flex-col">
                    <Link href={`/messages/${gig.ownerId ?? ""}`} className="reference-card-media aspect-video">
                      <SafeImage src={gig.image || gig.ownerImage || "/icons/logo.png"} alt={gig.title} fill sizes="(min-width: 1024px) 24vw, 100vw" className="object-cover" />
                      <span className="absolute bottom-2 right-2 rounded bg-black/80 px-2 py-1 text-[0.68rem] font-black text-white">
                        {gig.deliveryDays} day delivery
                      </span>
                    </Link>
                    <div className="flex flex-1 flex-col gap-3 p-3">
                      <div>
                        <p className="reference-card-title line-clamp-2 min-h-10">{gig.title}</p>
                        <p className="mt-1 flex min-w-0 items-center gap-1 text-xs font-semibold text-[hsl(var(--muted-foreground))]">
                          <span className="truncate">{gig.ownerName ?? "Freelancer"}</span>
                          {gig.isVerified ? <VerifiedMark label="Verified freelancer" className="size-3.5" /> : null}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        <Badge>{gig.category}</Badge>
                        <Badge>{gig.packageName}</Badge>
                        {(gig.tags ?? []).slice(0, 2).map((tag) => (
                          <Badge key={`${gig.slug}-${tag}`}>{tag}</Badge>
                        ))}
                      </div>
                      <p className="line-clamp-2 text-xs font-semibold leading-5 text-[hsl(var(--muted-foreground))]">{gig.description}</p>
                      <div className="mt-auto grid gap-2 text-xs font-semibold text-[hsl(var(--muted-foreground))]">
                        <div className="flex items-center justify-between gap-2">
                          <PriceDisplay price={gig.price} className="text-base font-black text-[hsl(var(--foreground))]" />
                          <span className="flex items-center gap-1 text-[hsl(var(--foreground))]">
                            <Star className="size-3.5 fill-amber-400 text-amber-400" />
                            {Number(gig.rating ?? 0).toFixed(1)} ({gig.orders ?? 0})
                          </span>
                        </div>
                        <p className="flex items-center gap-1.5">
                          <MapPin className="size-3.5 text-[hsl(var(--primary))]" />
                          <span className="line-clamp-1">{gigLocation(gig)}</span>
                        </p>
                        <Button asChild className="mt-1 h-9 w-full reference-primary-action">
                          <Link href={gig.ownerId ? `/messages/${gig.ownerId}` : "/messages"}>
                            <MessageSquare className="size-4" />
                            Request gig
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </article>
                ))}
                {Array.from({ length: gigFillerCount }).map((_, index) => (
                  <DirectoryFillCard key={`gig-fill-${index}`} kind="gigs" index={index} />
                ))}
              </>
            ) : (
              <div className="reference-card p-8 text-center text-sm text-[hsl(var(--muted-foreground))] md:col-span-4">
                No gigs match this search.
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
