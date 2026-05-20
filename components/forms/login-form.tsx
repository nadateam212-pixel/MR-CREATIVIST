"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { loginSchema, type LoginInput } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GoogleAuthButton } from "@/components/forms/google-auth-button";

export function LoginForm({ callbackUrl = "" }: { callbackUrl?: string }) {
  const [pending, setPending] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: ""
    }
  });

  const redirectTo =
    callbackUrl.startsWith("/") && !callbackUrl.startsWith("//") && !callbackUrl.includes("://")
      ? callbackUrl
      : "/dashboard";

  function toCurrentOriginPath(value?: string | null) {
    if (!value) return redirectTo;

    try {
      const url = new URL(value, window.location.origin);
      if (url.origin !== window.location.origin && !["localhost", "127.0.0.1", "::1"].includes(url.hostname)) {
        return redirectTo;
      }

      return `${url.pathname}${url.search}${url.hash}` || redirectTo;
    } catch {
      return redirectTo;
    }
  }

  async function onSubmit(input: LoginInput) {
    setPending(true);

    try {
      const result = await signIn("credentials", {
        email: input.email.toLowerCase().trim(),
        password: input.password,
        redirect: false,
        redirectTo
      });

      if (!result?.ok || result.error) {
        toast.error("Email or password is incorrect.");
        return;
      }

      toast.success("Signed in. Opening your dashboard...");
      window.location.assign(toCurrentOriginPath(result.url));
    } catch {
      toast.error("Sign in could not finish. Check your connection and try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-5">
      <GoogleAuthButton callbackUrl={callbackUrl} />
      <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
        <span className="h-px flex-1 bg-white/10" />
        Email and password
        <span className="h-px flex-1 bg-white/10" />
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <input type="hidden" name="callbackUrl" value={callbackUrl} />
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" {...register("email")} />
          {errors.email ? <p className="text-sm text-[hsl(var(--destructive))]">{errors.email.message}</p> : null}
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="password">Password</Label>
            <Link href="/forgot-password" className="text-xs font-bold text-cyan-200 hover:text-white">
              Forgot password?
            </Link>
          </div>
          <Input id="password" type="password" autoComplete="current-password" {...register("password")} />
          {errors.password ? <p className="text-sm text-[hsl(var(--destructive))]">{errors.password.message}</p> : null}
        </div>
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? <Loader2 className="size-4 animate-spin" /> : null}
          Sign in with password
        </Button>
      </form>
    </div>
  );
}
