import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, BadgeCheck, LockKeyhole, Sparkles } from "lucide-react";
import { LoginForm } from "@/components/forms/login-form";
import { brand } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Login"
};

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto grid min-h-screen w-full max-w-7xl px-4 py-8 sm:px-6 lg:grid-cols-[0.92fr_1.08fr] lg:items-center lg:gap-10">
        <section className="flex flex-col items-center justify-center text-center lg:min-h-[calc(100vh-4rem)]">
          <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm font-bold text-cyan-200 hover:text-white">
            <ArrowLeft className="size-4" />
            Back to MR Creativist
          </Link>

          <div className="relative flex size-24 overflow-hidden rounded-lg bg-white p-3 shadow-2xl shadow-cyan-500/20">
            <Image src={brand.logo} alt={brand.name} fill sizes="96px" className="object-contain p-2" priority />
          </div>

          <p className="mt-8 inline-flex items-center gap-2 rounded-md border border-cyan-400/25 bg-cyan-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-cyan-100">
            <Sparkles className="size-4" />
            Secure creator workspace
          </p>
          <h1 className="mt-6 max-w-2xl text-4xl font-black tracking-tight sm:text-6xl">Welcome back to MR Creativist</h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-slate-300">
            Continue learning, selling, messaging, publishing jobs and businesses, and creating with MrCreativist.AI.
          </p>

          <div className="mt-8 grid w-full max-w-xl gap-3 sm:grid-cols-3">
            {["Secure account", "Profile uploads", "AI tools"].map((item) => (
              <div key={item} className="rounded-md border border-white/10 bg-white/[0.04] p-4 text-sm font-semibold text-slate-200">
                <BadgeCheck className="mx-auto mb-2 size-5 text-cyan-300" />
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto mt-10 w-full max-w-xl lg:mt-0">
          <div className="rounded-lg border border-white/10 bg-white/[0.06] p-5 shadow-2xl shadow-black/30 backdrop-blur sm:p-8">
            <div className="mb-6 text-center">
              <LockKeyhole className="mx-auto mb-3 size-8 text-cyan-300" />
              <h2 className="text-2xl font-black tracking-tight">Sign in</h2>
              <p className="mt-2 text-sm text-slate-300">Access dashboard, messages, certificates, jobs, businesses and seller tools.</p>
            </div>
            <LoginForm />
            <p className="mt-6 text-center text-sm text-slate-300">
              New here?{" "}
              <Link href="/register" className="font-bold text-cyan-200 hover:text-white">
                Create your account
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
