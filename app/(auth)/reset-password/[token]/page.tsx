import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, KeyRound, LockKeyhole, ShieldCheck } from "lucide-react";
import { ResetPasswordForm } from "@/components/forms/reset-password-form";
import { brand } from "@/lib/brand";

export const metadata: Metadata = { title: "Reset Password" };

export default async function ResetPasswordPage({
  params
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto grid min-h-screen w-full max-w-7xl px-4 py-8 sm:px-6 lg:grid-cols-[0.92fr_1.08fr] lg:items-center lg:gap-10">
        <section className="flex flex-col items-center justify-center text-center lg:min-h-[calc(100vh-4rem)]">
          <Link href="/login" className="mb-8 inline-flex items-center gap-2 text-sm font-bold text-cyan-200 hover:text-white">
            <ArrowLeft className="size-4" />
            Back to sign in
          </Link>

          <div className="relative flex size-24 overflow-hidden rounded-lg bg-white p-3 shadow-2xl shadow-cyan-500/20">
            <Image src={brand.logo} alt={brand.name} fill sizes="96px" className="object-contain p-2" priority />
          </div>

          <p className="mt-8 inline-flex items-center gap-2 rounded-md border border-cyan-400/25 bg-cyan-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-cyan-100">
            <ShieldCheck className="size-4" />
            Secure reset
          </p>
          <h1 className="mt-6 max-w-2xl text-4xl font-black tracking-tight sm:text-6xl">Set a new password</h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-slate-300">
            Choose a strong password with at least eight characters, one uppercase letter and one number.
          </p>

          <div className="mt-8 grid w-full max-w-xl gap-3 sm:grid-cols-2">
            {["Single-use link", "Auto sign-in after reset"].map((item) => (
              <div key={item} className="rounded-md border border-white/10 bg-white/[0.04] p-4 text-sm font-semibold text-slate-200">
                <LockKeyhole className="mx-auto mb-2 size-5 text-cyan-300" />
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto mt-10 w-full max-w-xl lg:mt-0">
          <div className="rounded-lg border border-white/10 bg-white/[0.06] p-5 shadow-2xl shadow-black/30 backdrop-blur sm:p-8">
            <div className="mb-6 text-center">
              <KeyRound className="mx-auto mb-3 size-8 text-cyan-300" />
              <h2 className="text-2xl font-black tracking-tight">New password</h2>
              <p className="mt-2 text-sm text-slate-300">Your old password will stop working after this update.</p>
            </div>
            <ResetPasswordForm token={token} />
          </div>
        </section>
      </div>
    </main>
  );
}
