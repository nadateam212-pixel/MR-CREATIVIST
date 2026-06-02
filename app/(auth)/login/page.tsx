import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, BadgeCheck, LockKeyhole, Sparkles } from "lucide-react";
import { LoginForm } from "@/components/forms/login-form";
import { brand } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Login"
};

function cleanCallback(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw?.startsWith("/") || raw.startsWith("//") || raw.includes("://")) return "";
  return raw;
}

export default async function LoginPage({
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
            Secure creator workspace
          </p>
          <h1 className="mt-6 max-w-2xl text-4xl font-black tracking-tight sm:text-6xl">Welcome back to MR Creativist</h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-[hsl(var(--muted-foreground))]">
            Continue learning, selling, messaging, publishing jobs and businesses, and creating with MrCreativist.AI.
          </p>

          <div className="mt-8 grid w-full max-w-xl gap-3 sm:grid-cols-3">
            {["Secure account", "Profile uploads", "AI tools"].map((item) => (
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
              <LockKeyhole className="mx-auto mb-3 size-8 text-[hsl(var(--primary))]" />
              <h2 className="text-2xl font-black tracking-tight">Sign in</h2>
              <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">Access dashboard, messages, certificates, jobs, businesses and seller tools.</p>
            </div>
            <LoginForm callbackUrl={callbackUrl} />
            <p className="mt-6 text-center text-sm text-[hsl(var(--muted-foreground))]">
              New here?{" "}
              <Link href={callbackUrl ? `/register?callbackUrl=${encodeURIComponent(callbackUrl)}` : "/register"} className="font-bold text-[hsl(var(--primary))] hover:text-[hsl(var(--foreground))]">
                Create your account
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
