import Link from "next/link";
import { ArrowRight, Rocket, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
      <section className="border-b border-[hsl(var(--border))] bg-[hsl(var(--muted))]/35 text-[hsl(var(--foreground))]">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-5 sm:flex-row sm:items-end sm:justify-between sm:px-6">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[hsl(var(--primary))]">Opportunities</p>
            <h1 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">Open paths</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link href="/register">
                Start
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/courses">Courses</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="relative mb-5">
          <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
          <Input className="h-14 pl-12 text-base" placeholder="SEARCH OPPORTUNITIES, PROGRAMS, SKILLS OR ROLES" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {opportunities.map((item) => (
            <Card key={item}>
              <CardContent className="p-6">
                <Rocket className="mb-4 size-6 text-[hsl(var(--primary))]" />
                <p className="font-black uppercase">{item}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
