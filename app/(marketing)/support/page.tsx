import type { Metadata } from "next";
import Link from "next/link";
import { Mail, MessageSquare, Phone } from "lucide-react";
import { SupportAgent } from "@/components/platform/support-agent";
import { Button } from "@/components/ui/button";
import { brand } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Support"
};

export default function SupportPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-5 sm:px-6 lg:py-8">
      <SupportAgent />

      <section className="mt-4 grid gap-3 sm:grid-cols-3">
        <Button asChild variant="outline" className="h-12 justify-start">
          <Link href="/messages">
            <MessageSquare className="size-4" />
            Open messages
          </Link>
        </Button>
        <Button asChild variant="outline" className="h-12 justify-start">
          <a href={`mailto:${brand.email}`}>
            <Mail className="size-4" />
            {brand.email}
          </a>
        </Button>
        <Button asChild variant="outline" className="h-12 justify-start">
          <a href={`tel:${brand.phones[0].replace(/[^\d+]/g, "")}`}>
            <Phone className="size-4" />
            {brand.phones[0]}
          </a>
        </Button>
      </section>
    </div>
  );
}
