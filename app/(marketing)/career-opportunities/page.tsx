import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, GraduationCap, Handshake, Rocket, Search, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const opportunities = [
  "BECOME AN INSTRUCTOR",
  "SELL DIGITAL PRODUCTS",
  "JOIN CONSULTING NETWORK",
  "AFFILIATE PARTNERSHIP",
  "MULTIMEDIA CREATOR PROGRAM",
  "AI WORKFLOW SPECIALIST"
];

export default function CareerOpportunitiesPage() {
  return (
    <div>
      <section className="border-b border-[hsl(var(--border))] bg-[hsl(var(--muted))]/35 text-[hsl(var(--foreground))] dark:border-white/10 dark:bg-slate-950 dark:text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_0.9fr] lg:items-center">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-cyan-300">CAREER & OPPORTUNITIES</p>
            <h1 className="mt-3 text-4xl font-black uppercase tracking-tight sm:text-6xl">
              Build your career through learning, selling and creative digital work.
            </h1>
            <p className="mt-5 text-lg leading-8 text-[hsl(var(--muted-foreground))] dark:text-slate-300">
              MR Creativist helps instructors, sellers, consultants, affiliates and multimedia creators turn skills into
              visibility, income and long-term opportunity.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/register">
                  START YOUR PATH
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="dark:border-white dark:text-white dark:hover:bg-white/10" size="lg">
                <Link href="/courses">BROWSE COURSES</Link>
              </Button>
            </div>
          </div>
          <div className="relative min-h-[24rem] overflow-hidden rounded-lg">
            <Image
              src="https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=85"
              alt="Career opportunities"
              fill
              sizes="(min-width: 1024px) 45vw, 100vw"
              className="object-cover"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
          <Input className="h-14 pl-12 text-base" placeholder="SEARCH OPPORTUNITIES, PROGRAMS, SKILLS OR ROLES" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {opportunities.map((item) => (
            <Card key={item}>
              <CardContent className="p-6">
                <Rocket className="mb-4 size-6 text-[hsl(var(--primary))]" />
                <p className="font-black uppercase">{item}</p>
                <p className="mt-2 text-sm leading-6 text-[hsl(var(--muted-foreground))]">
                  Create a profile, build proof, use platform tools, and grow through the MR Creativist ecosystem.
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-t border-[hsl(var(--border))] bg-[hsl(var(--muted))]/45">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 py-12 sm:px-6 md:grid-cols-4">
          {[
            { title: "LEARN", icon: GraduationCap },
            { title: "WORK", icon: BriefcaseBusiness },
            { title: "PARTNER", icon: Handshake },
            { title: "GROW", icon: Users }
          ].map((item) => (
            <Card key={item.title}>
              <CardHeader>
                <item.icon className="mb-2 size-6 text-[hsl(var(--primary))]" />
                <CardTitle className="uppercase">{item.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm leading-6 text-[hsl(var(--muted-foreground))]">
                Move from skill development to real marketplace and consulting opportunities.
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
