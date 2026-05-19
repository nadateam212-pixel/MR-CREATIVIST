import Link from "next/link";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ConsultantCard } from "@/components/ui/consultant-card";
import { getConsultingServiceBySlug } from "@/lib/platform-db";

export default async function ConsultantProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const consultant = await getConsultingServiceBySlug(slug);

  if (!consultant) {
    return (
      <PageShell eyebrow="Consultant" title="Consultant not found" description="This consulting profile is not available yet.">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-[hsl(var(--muted-foreground))]">Publish a consulting service to view it here.</p>
            <Button asChild className="mt-5">
              <Link href="/consulting">Back to consulting</Link>
            </Button>
          </CardContent>
        </Card>
      </PageShell>
    );
  }

  return (
    <PageShell eyebrow="Consultant" title={consultant.name} description="Profile, expertise, service packages, availability calendar, ratings, and LiveKit-ready meeting setup.">
      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <ConsultantCard consultant={consultant} />
        <Button asChild>
          <Link href={`/consulting/book/${consultant.slug}`}>Book session</Link>
        </Button>
      </div>
    </PageShell>
  );
}
