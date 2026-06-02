import Image from "next/image";
import Link from "next/link";
import { getConsultingServices } from "@/lib/platform-db";
import { ConsultingDirectory } from "@/components/platform/consulting-directory";
import { Button } from "@/components/ui/button";

export default async function ConsultingPage() {
  const consultants = await getConsultingServices();

  return (
    <div>
      <section className="border-b border-[hsl(var(--border))] bg-[hsl(var(--muted))]/35 text-[hsl(var(--foreground))]">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_0.9fr] lg:items-center">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-[hsl(var(--primary))]">CONSULTING</p>
            <h1 className="mt-3 text-4xl font-black uppercase tracking-tight sm:text-6xl">
              Book experts for AI, media, business and selling systems.
            </h1>
            <p className="mt-5 text-lg leading-8 text-[hsl(var(--muted-foreground))]">
              Get practical guidance from verified consultants for course launches, multimedia production, digital
              selling, brand growth, automation, and business strategy.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="#consultants">BOOK SESSION</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/register">BECOME CONSULTANT</Link>
              </Button>
            </div>
          </div>
          <div className="relative min-h-[24rem] overflow-hidden rounded-lg">
            <Image
              src="https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1200&q=85"
              alt="Consulting session"
              fill
              sizes="(min-width: 1024px) 45vw, 100vw"
              className="object-cover"
            />
          </div>
        </div>
      </section>

      <div id="consultants">
        <ConsultingDirectory consultants={consultants} />
      </div>
    </div>
  );
}
