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
        <p className={`rounded-md border p-3 text-sm ${state.ok ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600" : "border-rose-500/30 bg-rose-500/10 text-rose-600"}`}>
          {state.message}
        </p>
      ) : null}

      <p className="text-center text-sm text-[hsl(var(--muted-foreground))]">
        Already reset it?{" "}
        <Link href="/login" className="font-bold text-[hsl(var(--primary))] hover:text-[hsl(var(--foreground))]">
          Sign in
        </Link>
      </p>
    </div>
  );
}
