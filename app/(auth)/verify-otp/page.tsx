import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { auth } from "@/auth";
import { OtpVerificationForm } from "@/components/forms/otp-verification-form";
import { brand } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Verify OTP"
};

function cleanCallback(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw?.startsWith("/") || raw.startsWith("//") || raw.includes("://")) return "";
  return raw;
}

export default async function VerifyOtpPage({
  searchParams
}: {
  searchParams: Promise<{ email?: string; mode?: string; callbackUrl?: string }>;
}) {
  const params = await searchParams;
  const session = await auth();
  const email = String(params.email ?? "").trim().toLowerCase();
  const mode = params.mode === "register" ? "register" : "login";

  if (!email) redirect(mode === "register" ? "/register" : "/login");

  return (
    <main className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      <div className="app-frame grid min-h-screen py-8 lg:grid-cols-[0.92fr_1.08fr] lg:items-center lg:gap-10">
        <section className="flex flex-col items-center justify-center text-center lg:min-h-[calc(100vh-4rem)]">
          <Link href={mode === "register" ? "/register" : "/login"} className="mb-8 inline-flex items-center gap-2 text-sm font-bold text-[hsl(var(--primary))] hover:text-[hsl(var(--foreground))]">
            <ArrowLeft className="size-4" />
            Back
          </Link>

          <div
            className="relative flex size-24 overflow-hidden rounded-lg bg-white p-3 shadow-2xl"
            style={{ boxShadow: "0 22px 70px hsl(var(--primary) / 0.1)" }}
          >
            <Image src={brand.logo} alt={brand.name} fill sizes="96px" className="object-contain p-2" priority />
          </div>

          <p className="mt-8 inline-flex items-center gap-2 rounded-md border border-[hsl(var(--primary))]/25 bg-[hsl(var(--primary))]/10 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-[hsl(var(--primary))]">
            <ShieldCheck className="size-4" />
            Email ownership check
          </p>
          <h1 className="mt-6 max-w-2xl text-4xl font-black tracking-tight sm:text-6xl">
            {mode === "register" ? "Verify your account" : "Verify your sign-in"}
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-[hsl(var(--muted-foreground))]">
            OTP confirms email ownership. Enter the latest code from your email to continue.
          </p>
        </section>

        <section className="mx-auto mt-10 w-full max-w-xl lg:mt-0">
          <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 shadow-2xl shadow-black/10 backdrop-blur sm:p-8">
            <OtpVerificationForm
              email={email}
              mode={mode}
              callbackUrl={cleanCallback(params.callbackUrl)}
              canSkip={Boolean(session?.user)}
            />
          </div>
        </section>
      </div>
    </main>
  );
}
