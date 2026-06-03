import Link from "next/link";
import { getConsultingServices } from "@/lib/platform-db";
import { ConsultingDirectory } from "@/components/platform/consulting-directory";
import { Button } from "@/components/ui/button";

export default async function ConsultingPage() {
  const consultants = await getConsultingServices();

  return (
    <div>
      <section className="border-b border-[hsl(var(--border))] bg-[hsl(var(--muted))]/35 text-[hsl(var(--foreground))]">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-5 sm:flex-row sm:items-end sm:justify-between sm:px-6">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[hsl(var(--primary))]">Consulting</p>
            <h1 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">Available experts</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link href="#consultants">Book session</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/register">Become consultant</Link>
            </Button>
          </div>
        </div>
      </section>

      <div id="consultants">
        <ConsultingDirectory consultants={consultants} />
      </div>
    </div>
  );
}
