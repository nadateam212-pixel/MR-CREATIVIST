"use client";

import { useActionState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { requestPasswordResetAction, type PasswordResetFormState } from "@/app/(auth)/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/forms/submit-button";

const initialState: PasswordResetFormState = {
  ok: false,
  message: ""
};

export function ForgotPasswordForm() {
  const [state, formAction] = useActionState(requestPasswordResetAction, initialState);

  useEffect(() => {
    if (state.message) {
      toast[state.ok ? "success" : "error"](state.message);
    }
  }, [state]);

  return (
    <div className="space-y-5">
      <form action={formAction} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Account email</Label>
          <Input id="email" name="email" type="email" autoComplete="email" defaultValue={state.email ?? ""} required />
        </div>
        <SubmitButton>Send reset link</SubmitButton>
      </form>

      {state.message ? (
        <p className={`rounded-md border p-3 text-sm ${state.ok ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-100" : "border-amber-400/30 bg-amber-400/10 text-amber-100"}`}>
          {state.message}
        </p>
      ) : null}

      <p className="text-center text-sm text-slate-300">
        Remembered it?{" "}
        <Link href="/login" className="font-bold text-cyan-200 hover:text-white">
          Sign in with password
        </Link>
      </p>
    </div>
  );
}
