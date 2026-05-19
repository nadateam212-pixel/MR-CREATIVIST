"use client";

import { useActionState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { resetPasswordAction, type PasswordResetFormState } from "@/app/(auth)/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/forms/submit-button";

const initialState: PasswordResetFormState = {
  ok: false,
  message: ""
};

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction] = useActionState(resetPasswordAction, initialState);

  useEffect(() => {
    if (state.message) {
      toast[state.ok ? "success" : "error"](state.message);
    }
  }, [state]);

  return (
    <div className="space-y-5">
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="token" value={token} />
        <div className="space-y-2">
          <Label htmlFor="password">New password</Label>
          <Input id="password" name="password" type="password" autoComplete="new-password" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm password</Label>
          <Input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required />
        </div>
        <SubmitButton>Update password</SubmitButton>
      </form>

      {state.message ? (
        <p className={`rounded-md border p-3 text-sm ${state.ok ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-100" : "border-rose-400/30 bg-rose-400/10 text-rose-100"}`}>
          {state.message}
        </p>
      ) : null}

      <p className="text-center text-sm text-slate-300">
        Already reset it?{" "}
        <Link href="/login" className="font-bold text-cyan-200 hover:text-white">
          Sign in
        </Link>
      </p>
    </div>
  );
}
