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
      <div className="rounded-md border border-cyan-400/25 bg-cyan-400/10 p-4 text-sm text-cyan-50">
        <MailCheck className="mb-3 size-5 text-cyan-200" />
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
        <Button asChild variant="outline" className="w-full border-white/20 bg-white/10 text-white hover:bg-white/15">
          <Link href={callbackUrl || "/dashboard"}>{mode === "register" ? "Skip for now" : "Continue to dashboard"}</Link>
        </Button>
      ) : null}

      <form action={resendAction}>
        <input type="hidden" name="email" value={email} />
        <input type="hidden" name="mode" value={mode} />
        <Button type="submit" variant="outline" className="w-full border-white/20 bg-white/10 text-white hover:bg-white/15" disabled={resending}>
          <RefreshCw className={resending ? "size-4 animate-spin" : "size-4"} />
          Send a new OTP
        </Button>
      </form>

      <p className="text-center text-xs leading-5 text-slate-400">
        Email not arriving?{" "}
        <Link href="/login" className="font-bold text-cyan-200 hover:text-white">
          Sign in with password
        </Link>{" "}
        or{" "}
        <Link href="/forgot-password" className="font-bold text-cyan-200 hover:text-white">
          reset your password
        </Link>
        .
      </p>
    </div>
  );
}
