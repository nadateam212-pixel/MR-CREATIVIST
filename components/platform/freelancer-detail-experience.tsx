"use client";

import Link from "next/link";
import { useState } from "react";
import { Bookmark, BriefcaseBusiness, Clock3, Languages, MapPin, MessageSquare, Send, Star, Trophy, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SafeImage } from "@/components/ui/safe-image";
import { VerifiedMark } from "@/components/ui/verified-mark";

type Profile = {
  id: string; profileId: string; slug: string; name: string; role: string; specialty: string; location: string; rate: number; rating: number; completed: number; responseHours: number; availability: number; portfolioScore: number; languages: string[]; skills: string[]; image: string; bio: string; isVerified?: boolean; userEmail?: string; userPhone?: string; portfolioItems?: Array<{ title: string; url: string; image?: string }>; reviews?: Array<{ clientName: string; rating: number; comment?: string; createdAt?: string }>;
};
type Gig = { id?: string; slug: string; title: string; category: string; description: string; price: string; deliveryDays: number; image: string; images?: string[]; rating: number; orders: number };

export function FreelancerDetailExperience({ profile, gigs }: { profile: Profile; gigs: Gig[] }) {
  const [saved, setSaved] = useState(false);
  function toggleSaved() {
    const next = !saved;
    setSaved(next);
    window.localStorage.setItem(`saved-freelancer:${profile.profileId}`, next ? "1" : "0");
  }
  const messageHref = `/messages/${profile.id}`;

  return (
    <div className="border-y border-[hsl(var(--border))] bg-[hsl(var(--muted))]/25">
      <div className="app-frame space-y-5 py-6">
        <section className="grid gap-5 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 lg:grid-cols-[9rem_1fr_15rem]">
          <div className="relative aspect-square overflow-hidden rounded-full border border-[hsl(var(--border))]"><SafeImage src={profile.image || "/icons/logo.png"} alt={profile.name} fill sizes="144px" className="object-cover" /></div>
          <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h1 className="text-2xl font-black">{profile.name}</h1>{profile.isVerified ? <VerifiedMark label="Verified freelancer" /> : null}<Badge className="border-emerald-500/35 text-emerald-600">Available for work</Badge></div><p className="mt-1 font-semibold text-[hsl(var(--muted-foreground))]">{profile.role}</p><p className="mt-3 flex items-center gap-2 text-sm"><MapPin className="size-4" />{profile.location}</p><div className="mt-3 flex flex-wrap gap-2"><Badge><Star className="mr-1 size-3 fill-amber-400 text-amber-400" />{profile.rating.toFixed(1)}</Badge><Badge>{profile.specialty}</Badge><Badge>FRW {Number(profile.rate || 0).toLocaleString()} / hour</Badge></div><p className="mt-4 max-w-3xl text-sm leading-6 text-[hsl(var(--muted-foreground))]">{profile.bio || `${profile.name} provides professional ${profile.specialty.toLowerCase()} services through MR Creativist.`}</p></div>
          <div className="grid content-start gap-2"><Button asChild><Link href={messageHref}><Send className="size-4" />Hire me</Link></Button><Button asChild variant="outline"><Link href={messageHref}><MessageSquare className="size-4" />Message</Link></Button><Button variant="outline" onClick={toggleSaved}><Bookmark className={saved ? "size-4 fill-current" : "size-4"} />{saved ? "Saved" : "Save"}</Button></div>
          <div className="grid gap-3 border-t border-[hsl(var(--border))] pt-4 sm:grid-cols-2 lg:col-span-3 lg:grid-cols-5">
            {[{ label: "Jobs completed", value: profile.completed, icon: BriefcaseBusiness }, { label: "Client reviews", value: profile.reviews?.length ?? 0, icon: Star }, { label: "Availability", value: `${profile.availability}%`, icon: Clock3 }, { label: "Portfolio score", value: `${profile.portfolioScore}%`, icon: Trophy }, { label: "Response time", value: `${profile.responseHours}h`, icon: Users }].map((item) => <div key={item.label} className="flex items-center gap-3"><item.icon className="size-5 text-[hsl(var(--primary))]" /><div><p className="font-black">{item.value}</p><p className="text-xs text-[hsl(var(--muted-foreground))]">{item.label}</p></div></div>)}
          </div>
        </section>

        <div className="grid gap-5 lg:grid-cols-[1fr_19rem]">
          <main className="space-y-5">
            <Card className="rounded-md"><CardHeader><CardTitle>Services</CardTitle></CardHeader><CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{gigs.map((gig) => <article key={gig.slug} className="overflow-hidden rounded-md border border-[hsl(var(--border))]"><div className="relative aspect-video"><SafeImage src={gig.image || "/icons/logo.png"} alt={gig.title} fill sizes="320px" className="object-cover" /></div><div className="p-3"><p className="font-black">{gig.title}</p><p className="mt-1 line-clamp-2 text-sm text-[hsl(var(--muted-foreground))]">{gig.description}</p><div className="mt-3 flex items-center justify-between gap-2"><span className="font-black text-[hsl(var(--primary))]">{gig.price}</span><Button asChild size="sm" variant="outline"><Link href={messageHref}>Request</Link></Button></div></div></article>)}{!gigs.length ? <p className="text-sm text-[hsl(var(--muted-foreground))] sm:col-span-2">No published service packages yet.</p> : null}</CardContent></Card>
            <Card className="rounded-md"><CardHeader><CardTitle>Portfolio</CardTitle></CardHeader><CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{(profile.portfolioItems ?? []).map((item) => <a key={`${item.title}-${item.url}`} href={item.url} target="_blank" rel="noreferrer" className="overflow-hidden rounded-md border border-[hsl(var(--border))]"><div className="relative aspect-video"><SafeImage src={item.image || profile.image} alt={item.title} fill sizes="320px" className="object-cover" /></div><p className="p-3 font-bold">{item.title}</p></a>)}{!profile.portfolioItems?.length ? <p className="text-sm text-[hsl(var(--muted-foreground))]">Portfolio projects will appear here.</p> : null}</CardContent></Card>
          </main>
          <aside className="space-y-4"><Card className="rounded-md"><CardHeader><CardTitle className="text-base">Skills</CardTitle></CardHeader><CardContent className="flex flex-wrap gap-2">{profile.skills.map((skill) => <Badge key={skill}>{skill}</Badge>)}</CardContent></Card><Card className="rounded-md"><CardHeader><CardTitle className="text-base">Languages</CardTitle></CardHeader><CardContent className="space-y-2">{profile.languages.map((language) => <p key={language} className="flex items-center gap-2 text-sm"><Languages className="size-4 text-[hsl(var(--primary))]" />{language}</p>)}</CardContent></Card><Card className="rounded-md"><CardHeader><CardTitle className="text-base">Contact</CardTitle></CardHeader><CardContent className="space-y-2 text-sm"><p>Responds within {profile.responseHours} hours</p><p className="break-all text-[hsl(var(--muted-foreground))]">{profile.userEmail || "Contact through secure messages"}</p></CardContent></Card></aside>
        </div>
      </div>
    </div>
  );
}
