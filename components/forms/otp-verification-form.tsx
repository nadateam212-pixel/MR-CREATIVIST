"use client";

import { useActionState, useEffect } from "react";
import Link from "next/link";
import { MailCheck, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { resendOtpAction, verifyOtpAction, type OtpFormState } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/forms/submit-button";

const initialState: OtpFormState = {
  ok: false,
  message: ""
};

export function OtpVerificationForm({
  email,
  mode,
  callbackUrl = "",
  canSkip = false
}: {
  email: string;
  mode: "login" | "register";
  callbackUrl?: string;
  canSkip?: boolean;
}) {
  const [verifyState, verifyAction] = useActionState(verifyOtpAction, { ...initialState, email });
  const [resendState, resendAction, resending] = useActionState(resendOtpAction, { ...initialState, email });

  useEffect(() => {
    if (verifyState.message) {
      toast[verifyState.ok ? "success" : "error"](verifyState.message);
    }
  }, [verifyState]);

  useEffect(() => {
    if (resendState.message) {
      toast[resendState.ok ? "success" : "error"](resendState.message);
    }
  }, [resendState]);

  return (
    <div className="space-y-5">
      <div className="rounded-md border border-[hsl(var(--primary))]/25 bg-[hsl(var(--primary))]/10 p-4 text-sm text-[hsl(var(--foreground))]">
        <MailCheck className="mb-3 size-5 text-[hsl(var(--primary))]" />
        Enter the 6-digit OTP sent to <span className="font-bold">{email}</span>. If it does not arrive, use password
        sign-in as the fallback.
      </div>

      <form action={verifyAction} className="space-y-4">
        <input type="hidden" name="email" value={email} />
        <input type="hidden" name="mode" value={mode} />
        <input type="hidden" name="callbackUrl" value={callbackUrl} />
        <div className="space-y-2">
          <Label htmlFor="code">OTP code</Label>
          <Input
            id="code"
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            pattern="[0-9]{6}"
            placeholder="123456"
            className="text-center text-2xl font-black tracking-[0.28em]"
            required
          />
        </div>
        <SubmitButton>{mode === "register" ? "Verify account" : "Verify and sign in"}</SubmitButton>
      </form>

      {canSkip ? (
        <Button asChild variant="outline" className="w-full border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]">
          <Link href={callbackUrl || "/dashboard"}>{mode === "register" ? "Skip for now" : "Continue to dashboard"}</Link>
        </Button>
      ) : null}

      <form action={resendAction}>
        <input type="hidden" name="email" value={email} />
        <input type="hidden" name="mode" value={mode} />
        <Button type="submit" variant="outline" className="w-full border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]" disabled={resending}>
          <RefreshCw className={resending ? "size-4 animate-spin" : "size-4"} />
          Send a new OTP
        </Button>
      </form>

      <p className="text-center text-xs leading-5 text-[hsl(var(--muted-foreground))]">
        Email not arriving?{" "}
        <Link href="/login" className="font-bold text-[hsl(var(--primary))] hover:text-[hsl(var(--foreground))]">
          Sign in with password
        </Link>{" "}
        or{" "}
        <Link href="/forgot-password" className="font-bold text-[hsl(var(--primary))] hover:text-[hsl(var(--foreground))]">
          reset your password
        </Link>
        .
      </p>
    </div>
  );
}
