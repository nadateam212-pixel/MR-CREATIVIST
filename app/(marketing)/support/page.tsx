import type { Metadata } from "next";
import Link from "next/link";
import { LifeBuoy, Mail, MessageSquare, Phone, ShieldCheck } from "lucide-react";
import { SupportAgent } from "@/components/platform/support-agent";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { brand } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Support"
};

export default function SupportPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <section className="grid gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.2em] text-[hsl(var(--primary))]">Support</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-6xl">Get help from MR Creativist.</h1>
          <p className="mt-5 text-lg leading-8 text-[hsl(var(--muted-foreground))]">
            Use the AI agent for instant guidance, open messages with the team, or contact us for account, learning,
            marketplace, business, job and payment support.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {[
              { label: "Account help", body: "Roles, validation, profile, security and settings.", icon: ShieldCheck },
              { label: "Marketplace support", body: "Orders, cart, products, sellers and business listings.", icon: LifeBuoy },
              { label: "Messages", body: "Contact sellers, freelancers, businesses or support staff.", icon: MessageSquare },
              { label: "Learning", body: "Courses, videos, certificates, quizzes and downloads.", icon: LifeBuoy }
            ].map((item) => (
              <Card key={item.label}>
                <CardContent className="p-5">
                  <item.icon className="mb-3 size-5 text-[hsl(var(--primary))]" />
                  <p className="font-semibold">{item.label}</p>
                  <p className="mt-2 text-sm leading-6 text-[hsl(var(--muted-foreground))]">{item.body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <SupportAgent />
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="size-5 text-[hsl(var(--primary))]" />
              Message support
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-6 text-[hsl(var(--muted-foreground))]">Use your platform inbox for account and public listing conversations.</p>
            <Button asChild className="mt-4">
              <Link href="/messages">Open messages</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="size-5 text-[hsl(var(--primary))]" />
              Email
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-6 text-[hsl(var(--muted-foreground))]">Send documents, screenshots or detailed questions.</p>
            <Button asChild variant="outline" className="mt-4">
              <a href={`mailto:${brand.email}`}>{brand.email}</a>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="size-5 text-[hsl(var(--primary))]" />
              Phone
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-6 text-[hsl(var(--muted-foreground))]">Call or use WhatsApp during business hours.</p>
            <div className="mt-4 grid gap-2">
              {brand.phones.map((phone) => (
                <Button key={phone} asChild variant="outline">
                  <a href={`tel:${phone.replaceAll(" ", "")}`}>{phone}</a>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
