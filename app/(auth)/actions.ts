"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { signIn } from "@/auth";
import connectMongoDB from "@/lib/mongodb";
import { rateLimit } from "@/lib/rate-limit";
import { loginSchema, registerSchema } from "@/lib/validations";
import User from "@/models/User";

export type FormState = {
  ok: boolean;
  message: string;
};

function sanitizeRedirectTarget(value: unknown) {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (!trimmed.startsWith("/")) return "";
  if (trimmed.startsWith("//")) return "";
  if (trimmed.includes("://")) return "";
  return trimmed;
}

export async function loginAction(_state: FormState, formData: FormData): Promise<FormState> {
  const raw = Object.fromEntries(formData);
  const callbackUrl = sanitizeRedirectTarget(raw.callbackUrl);
  const parsed = loginSchema.safeParse(raw);

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid login details." };
  }

  const normalizedEmail = parsed.data.email.toLowerCase();
  const limit = rateLimit(`login:${normalizedEmail}`, 8, 15 * 60_000);
  if (!limit.success) {
    return { ok: false, message: "Too many login attempts. Try again later." };
  }

  let redirectTo = "/dashboard";

  try {
    await signIn("credentials", {
      email: normalizedEmail,
      password: parsed.data.password,
      redirect: false
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { ok: false, message: "Email or password is incorrect." };
    }

    throw error;
  }

  try {
    await connectMongoDB();
    const user = await User.findOne({ email: normalizedEmail }).select("role").lean();
    const role = String(user?.role ?? "client");

    if (role === "admin") {
      redirectTo = callbackUrl.startsWith("/admin") ? callbackUrl : "/admin/dashboard";
    } else {
      redirectTo = callbackUrl || "/dashboard";
    }
  } catch {
    redirectTo = callbackUrl || "/dashboard";
  }

  redirect(redirectTo);
}

export async function registerAction(_state: FormState, formData: FormData): Promise<FormState> {
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid registration details." };
  }

  const normalizedEmail = parsed.data.email.toLowerCase();
  const limit = rateLimit(`register:${normalizedEmail}`, 5, 60 * 60_000);
  if (!limit.success) {
    return { ok: false, message: "Too many registration attempts. Try again later." };
  }

  await connectMongoDB();
  const existingUser = await User.exists({ email: normalizedEmail });

  if (existingUser) {
    return { ok: false, message: "An account already exists for this email." };
  }

  const hashedPassword = await bcrypt.hash(parsed.data.password, 12);
  const user = await User.create({
    name: parsed.data.name.trim(),
    email: normalizedEmail,
    passwordHash: hashedPassword,
    role: "client",
    validatedRoles: ["client"]
  });

  await signIn("credentials", {
    email: user.email,
    password: parsed.data.password,
    redirect: false
  });

  redirect("/dashboard");
}
