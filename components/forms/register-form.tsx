"use client";

import { useActionState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { registerAction, type FormState } from "@/app/(auth)/actions";
import { registerSchema, type RegisterInput } from "@/lib/validations";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GoogleAuthButton } from "@/components/forms/google-auth-button";
import { SubmitButton } from "@/components/forms/submit-button";

const initialState: FormState = {
  ok: false,
  message: ""
};

export function RegisterForm({ callbackUrl = "" }: { callbackUrl?: string }) {
  const [state, formAction] = useActionState(registerAction, initialState);
  const {
    register,
    formState: { errors }
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: ""
    }
  });

  useEffect(() => {
    if (state.message && !state.ok) {
      toast.error(state.message);
    }
  }, [state]);

  return (
    <div className="space-y-5">
      <GoogleAuthButton label="Register with Google" callbackUrl={callbackUrl} />
      <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
        <span className="h-px flex-1 bg-white/10" />
        Email and password
        <span className="h-px flex-1 bg-white/10" />
      </div>
      <form action={formAction} className="space-y-4">
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
        <SubmitButton>Create account</SubmitButton>
      </form>
    </div>
  );
}
