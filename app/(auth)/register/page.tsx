import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, BadgeCheck, Rocket, Sparkles } from "lucide-react";
import { RegisterForm } from "@/components/forms/register-form";
import { brand } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Register"
};

function cleanCallback(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw?.startsWith("/") || raw.startsWith("//") || raw.includes("://")) return "";
  return raw;
}

export default async function RegisterPage({
  searchParams
}: {
  searchParams: Promise<{ callbackUrl?: string | string[] }>;
}) {
  const params = await searchParams;
  const callbackUrl = cleanCallback(params.callbackUrl);

  return (
    <main className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      <div className="mx-auto grid min-h-screen w-full max-w-7xl px-4 py-8 sm:px-6 lg:grid-cols-[0.92fr_1.08fr] lg:items-center lg:gap-10">
        <section className="flex flex-col items-center justify-center text-center lg:min-h-[calc(100vh-4rem)]">
          <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm font-bold text-[hsl(var(--primary))] hover:text-[hsl(var(--foreground))]">
            <ArrowLeft className="size-4" />
            Back to MR Creativist
          </Link>

          <div
            className="relative flex size-24 overflow-hidden rounded-lg bg-white p-3 shadow-2xl"
            style={{ boxShadow: "0 22px 70px hsl(var(--primary) / 0.1)" }}
          >
            <Image src={brand.logo} alt={brand.name} fill sizes="96px" className="object-contain p-2" priority />
          </div>

          <p className="mt-8 inline-flex items-center gap-2 rounded-md border border-[hsl(var(--primary))]/25 bg-[hsl(var(--primary))]/10 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-[hsl(var(--primary))]">
            <Sparkles className="size-4" />
            Build your digital future
          </p>
          <h1 className="mt-6 max-w-2xl text-4xl font-black tracking-tight sm:text-6xl">Create your MR Creativist account</h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-[hsl(var(--muted-foreground))]">
            Join one platform for courses, marketplace selling, businesses, jobs, messages, certificates and MrCreativist.AI.
          </p>

          <div className="mt-8 grid w-full max-w-xl gap-3 sm:grid-cols-3">
            {["Learn", "Sell", "Create"].map((item) => (
              <div key={item} className="rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 text-sm font-semibold text-[hsl(var(--foreground))]">
                <BadgeCheck className="mx-auto mb-2 size-5 text-[hsl(var(--primary))]" />
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto mt-10 w-full max-w-xl lg:mt-0">
          <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 shadow-2xl shadow-black/10 backdrop-blur sm:p-8">
            <div className="mb-6 text-center">
              <Rocket className="mx-auto mb-3 size-8 text-[hsl(var(--primary))]" />
              <h2 className="text-2xl font-black tracking-tight">Create account</h2>
              <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">Start as a learner, client, seller, freelancer, consultant or instructor.</p>
            </div>
            <RegisterForm callbackUrl={callbackUrl} />
            <p className="mt-6 text-center text-sm text-[hsl(var(--muted-foreground))]">
              Already have an account?{" "}
              <Link href={callbackUrl ? `/login?callbackUrl=${encodeURIComponent(callbackUrl)}` : "/login"} className="font-bold text-[hsl(var(--primary))] hover:text-[hsl(var(--foreground))]">
                Sign in
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
