import { Award, Lightbulb, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
      <section className="mx-auto max-w-7xl px-4 py-5 sm:px-6">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[hsl(var(--primary))]">About</p>
          <h1 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">MR Creativist</h1>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-5 sm:px-6">
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
    </div>
  );
}
