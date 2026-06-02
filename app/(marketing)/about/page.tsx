import Image from "next/image";
import { Award, Globe2, Lightbulb, Rocket, ShieldCheck, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { brand } from "@/lib/brand";

const values = [
  {
    title: "INNOVATION",
    body: "We turn AI, learning systems, multimedia, and commerce tools into practical products people can use.",
    icon: Lightbulb
  },
  {
    title: "COMMUNITY",
    body: "We build for learners, sellers, creators, instructors, consultants, and businesses growing from Africa to the world.",
    icon: Users
  },
  {
    title: "EXCELLENCE",
    body: "We care about clean design, strong content, reliable operations, and measurable outcomes.",
    icon: Award
  }
];

export default function AboutPage() {
  return (
    <div>
      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.2em] text-[hsl(var(--primary))]">ABOUT MR CREATIVIST</p>
          <h1 className="mt-3 text-4xl font-black uppercase tracking-tight sm:text-6xl">
            Empowering digital learning, selling and media innovation.
          </h1>
          <p className="mt-5 text-lg leading-8 text-[hsl(var(--muted-foreground))]">
            Based in {brand.address}, MR Creativist helps people learn high-value skills, sell digital and physical
            products, book consulting, create multimedia content, and use AI tools to move faster.
          </p>
        </div>
        <div className="relative min-h-[24rem] overflow-hidden rounded-lg">
          <Image
            src="https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=1200&q=85"
            alt="MR Creativist team building digital products"
            fill
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover"
          />
        </div>
      </section>

      <section className="border-y border-[hsl(var(--border))] bg-[hsl(var(--muted))]/45">
        <div className="mx-auto grid max-w-7xl gap-5 px-4 py-12 sm:px-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <Rocket className="mb-2 size-7 text-[hsl(var(--primary))]" />
              <CardTitle className="uppercase">OUR MISSION</CardTitle>
            </CardHeader>
            <CardContent className="text-base leading-7 text-[hsl(var(--muted-foreground))]">
              To make world-class digital education, multimedia production, AI workflows, and marketplace selling tools
              accessible to ambitious creators, businesses, and learners.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Globe2 className="mb-2 size-7 text-[hsl(var(--primary))]" />
              <CardTitle className="uppercase">OUR VISION</CardTitle>
            </CardHeader>
            <CardContent className="text-base leading-7 text-[hsl(var(--muted-foreground))]">
              To become a trusted African digital ecosystem where people learn, launch, sell, consult, and scale with
              confidence in English, Kinyarwanda, FRW, and USD.
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="mb-10 max-w-3xl">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-[hsl(var(--primary))]">OUR VALUES</p>
          <h2 className="mt-3 text-3xl font-black uppercase tracking-tight sm:text-5xl">Built for trust, creativity and measurable growth</h2>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {values.map((value) => (
            <Card key={value.title}>
              <CardHeader>
                <value.icon className="mb-2 size-7 text-[hsl(var(--primary))]" />
                <CardTitle className="uppercase">{value.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm leading-6 text-[hsl(var(--muted-foreground))]">{value.body}</CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
        <div className="grid gap-4 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-8 text-[hsl(var(--foreground))] md:grid-cols-4">
          {[
            ["5+", "YEARS OF DIGITAL WORK"],
            ["50K+", "ACTIVE LEARNERS"],
            ["1.5K+", "COURSE AND PRODUCT ASSETS"],
            ["98%", "SATISFACTION TARGET"]
          ].map(([value, label]) => (
            <div key={label}>
              <p className="text-4xl font-black">{value}</p>
              <p className="mt-2 text-xs font-black uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))]">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
        <Card>
          <CardHeader>
            <ShieldCheck className="mb-2 size-7 text-[hsl(var(--primary))]" />
            <CardTitle className="uppercase">WHY CHOOSE MR CREATIVIST</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm leading-6 text-[hsl(var(--muted-foreground))] md:grid-cols-3">
            <p>One platform for courses, marketplace selling, consulting, wallet operations, and digital workflows.</p>
            <p>Public experiences built for modern learners, creators, sellers, and businesses.</p>
            <p>Local relevance from Experts with international payments, language settings, and global reach.</p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
