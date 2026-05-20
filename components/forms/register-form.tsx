"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { registerSchema, type RegisterInput } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GoogleAuthButton } from "@/components/forms/google-auth-button";

export function RegisterForm({ callbackUrl = "" }: { callbackUrl?: string }) {
  const [pending, setPending] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
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

  async function onSubmit(input: RegisterInput) {
    setPending(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: input.name,
          email: input.email.toLowerCase().trim(),
          password: input.password
        })
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error ?? "Account could not be created.");
      }

      const result = await signIn("credentials", {
        email: input.email.toLowerCase().trim(),
        password: input.password,
        redirect: false,
        redirectTo
      });

      if (!result?.ok || result.error) {
        toast.success("Account created. Sign in with your password to continue.");
        window.location.assign(`/login?callbackUrl=${encodeURIComponent(redirectTo)}`);
        return;
      }

      toast.success("Account ready. Opening your dashboard...");
      window.location.assign(toCurrentOriginPath(result.url));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Registration could not finish.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-5">
      <GoogleAuthButton label="Register with Google" callbackUrl={callbackUrl} />
      <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
        <span className="h-px flex-1 bg-white/10" />
        Email and password
        <span className="h-px flex-1 bg-white/10" />
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <input type="hidden" name="callbackUrl" value={callbackUrl} />
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" type="text" autoComplete="name" {...register("name")} />
          {errors.name ? <p className="text-sm text-[hsl(var(--destructive))]">{errors.name.message}</p> : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" {...register("email")} />
          {errors.email ? <p className="text-sm text-[hsl(var(--destructive))]">{errors.email.message}</p> : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" autoComplete="new-password" {...register("password")} />
          {errors.password ? <p className="text-sm text-[hsl(var(--destructive))]">{errors.password.message}</p> : null}
        </div>
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? <Loader2 className="size-4 animate-spin" /> : null}
          Create account
        </Button>
      </form>
    </div>
  );
}
