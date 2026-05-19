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
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto grid min-h-screen w-full max-w-7xl px-4 py-8 sm:px-6 lg:grid-cols-[0.92fr_1.08fr] lg:items-center lg:gap-10">
        <section className="flex flex-col items-center justify-center text-center lg:min-h-[calc(100vh-4rem)]">
          <Link href={mode === "register" ? "/register" : "/login"} className="mb-8 inline-flex items-center gap-2 text-sm font-bold text-cyan-200 hover:text-white">
            <ArrowLeft className="size-4" />
            Back
          </Link>

          <div className="relative flex size-24 overflow-hidden rounded-lg bg-white p-3 shadow-2xl shadow-cyan-500/20">
            <Image src={brand.logo} alt={brand.name} fill sizes="96px" className="object-contain p-2" priority />
          </div>

          <p className="mt-8 inline-flex items-center gap-2 rounded-md border border-cyan-400/25 bg-cyan-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-cyan-100">
            <ShieldCheck className="size-4" />
            Email ownership check
          </p>
          <h1 className="mt-6 max-w-2xl text-4xl font-black tracking-tight sm:text-6xl">
            {mode === "register" ? "Verify your account" : "Verify your sign-in"}
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-slate-300">
            OTP confirms email ownership. If email delivery is delayed, password sign-in remains available.
          </p>
        </section>

        <section className="mx-auto mt-10 w-full max-w-xl lg:mt-0">
          <div className="rounded-lg border border-white/10 bg-white/[0.06] p-5 shadow-2xl shadow-black/30 backdrop-blur sm:p-8">
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
