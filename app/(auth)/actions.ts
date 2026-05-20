"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { signIn } from "@/auth";
import { createAndSendAuthOtp, type AuthOtpPurpose } from "@/lib/auth-otp";
import connectMongoDB from "@/lib/mongodb";
import { createAndSendPasswordReset, resetPasswordWithToken } from "@/lib/password-reset";
import { rateLimit } from "@/lib/rate-limit";
import { forgotPasswordSchema, loginSchema, registerSchema, resetPasswordSchema } from "@/lib/validations";
import User from "@/models/User";

export type FormState = {
  ok: boolean;
  message: string;
};

export type OtpFormState = FormState & {
  email?: string;
};

export type PasswordResetFormState = FormState & {
  email?: string;
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

  let redirectTo = callbackUrl || "/dashboard";
  let otpRedirect = "";

  try {
    await connectMongoDB();
    const user = await User.findOne({ email: normalizedEmail }).select("_id name role emailVerifiedAt").lean();
    const role = String(user?.role ?? "client");

    if (role === "admin") {
      redirectTo = callbackUrl.startsWith("/admin") ? callbackUrl : "/admin/dashboard";
    } else if (user && !user.emailVerifiedAt) {
      const otp = await createAndSendAuthOtp(normalizedEmail, "login", {
        userId: String(user._id),
        name: user.name
      });

      if (otp.delivery.ok) {
        otpRedirect = `/verify-otp?email=${encodeURIComponent(normalizedEmail)}&mode=login&optional=1&callbackUrl=${encodeURIComponent(redirectTo)}`;
      }
    }
  } catch {
    redirectTo = callbackUrl || "/dashboard";
  }

  if (otpRedirect) redirect(otpRedirect);

  redirect(redirectTo);
}

export async function registerAction(_state: FormState, formData: FormData): Promise<FormState> {
  const raw = Object.fromEntries(formData);
  const callbackUrl = sanitizeRedirectTarget(raw.callbackUrl);
  const redirectTo = callbackUrl || "/dashboard";
  const parsed = registerSchema.safeParse(raw);

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid registration details." };
  }

  const normalizedEmail = parsed.data.email.toLowerCase();
  const limit = rateLimit(`register:${normalizedEmail}`, 5, 60 * 60_000);
  if (!limit.success) {
    return { ok: false, message: "Too many registration attempts. Try again later." };
  }

  await connectMongoDB();
  const existingUser = await User.findOne({ email: normalizedEmail }).select("+passwordHash emailVerifiedAt name").lean();

  if (existingUser) {
    if (!existingUser.emailVerifiedAt && existingUser.passwordHash) {
      const validPassword = await bcrypt.compare(parsed.data.password, existingUser.passwordHash);
      if (validPassword) {
        const otp = await createAndSendAuthOtp(normalizedEmail, "register", {
          userId: String(existingUser._id),
          name: existingUser.name
        });
        await signIn("credentials", {
          email: normalizedEmail,
          password: parsed.data.password,
          redirect: false
        });
        redirect(
          otp.delivery.ok
            ? `/verify-otp?email=${encodeURIComponent(normalizedEmail)}&mode=register&optional=1&callbackUrl=${encodeURIComponent(redirectTo)}`
            : redirectTo
        );
      }
    }

    return { ok: false, message: "An account already exists for this email." };
  }

  const hashedPassword = await bcrypt.hash(parsed.data.password, 12);
  const user = await User.create({
    name: parsed.data.name.trim(),
    email: normalizedEmail,
    passwordHash: hashedPassword,
    role: "client",
    validatedRoles: ["client"],
    authProviders: ["credentials"]
  });

  const otp = await createAndSendAuthOtp(user.email, "register", {
    userId: String(user._id),
    name: user.name
  });

  await signIn("credentials", {
    email: user.email,
    password: parsed.data.password,
    redirect: false
  });

  redirect(
    otp.delivery.ok
      ? `/verify-otp?email=${encodeURIComponent(user.email)}&mode=register&optional=1&callbackUrl=${encodeURIComponent(redirectTo)}`
      : redirectTo
  );
}

export async function verifyOtpAction(_state: OtpFormState, formData: FormData): Promise<OtpFormState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const code = String(formData.get("code") ?? "").trim();
  const purpose = (formData.get("mode") === "register" ? "register" : "login") as AuthOtpPurpose;
  const callbackUrl = sanitizeRedirectTarget(formData.get("callbackUrl"));

  if (!email || !/^\d{6}$/.test(code)) {
    return { ok: false, email, message: "Enter the 6-digit OTP sent to your email." };
  }

  try {
    await signIn("email-otp", {
      email,
      code,
      purpose,
      redirect: false
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { ok: false, email, message: "The OTP code is invalid or expired." };
    }

    throw error;
  }

  let redirectTo = callbackUrl || "/dashboard";

  try {
    await connectMongoDB();
    const user = await User.findOne({ email }).select("role").lean();
    if (String(user?.role ?? "client") === "admin") {
      redirectTo = callbackUrl.startsWith("/admin") ? callbackUrl : "/admin/dashboard";
    }
  } catch {
    redirectTo = callbackUrl || "/dashboard";
  }

  redirect(redirectTo);
}

export async function resendOtpAction(_state: OtpFormState, formData: FormData): Promise<OtpFormState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const purpose = (formData.get("mode") === "register" ? "register" : "login") as AuthOtpPurpose;

  if (!email) {
    return { ok: false, message: "Email is required to resend the OTP." };
  }

  const limit = rateLimit(`resend-otp:${purpose}:${email}`, 3, 10 * 60_000);
  if (!limit.success) {
    return { ok: false, email, message: "Too many OTP requests. Wait a few minutes and try again." };
  }

  await connectMongoDB();
  const user = await User.findOne({ email }).select("_id name").lean();
  if (!user) {
    return { ok: false, email, message: "No account exists for this email." };
  }

  const otp = await createAndSendAuthOtp(email, purpose, {
    userId: String(user._id),
    name: user.name
  });

  if (!otp.delivery.ok) {
    return {
      ok: false,
      email,
      message: `${otp.delivery.message} You can still sign in with your password.`
    };
  }

  return { ok: true, email, message: "A new OTP was sent to your email." };
}

export async function requestPasswordResetAction(
  _state: PasswordResetFormState,
  formData: FormData
): Promise<PasswordResetFormState> {
  const parsed = forgotPasswordSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Enter a valid email address." };
  }

  const email = parsed.data.email.toLowerCase();
  const limit = rateLimit(`password-reset:${email}`, 4, 60 * 60_000);
  if (!limit.success) {
    return { ok: false, email, message: "Too many reset requests. Try again later." };
  }

  const result = await createAndSendPasswordReset(email);

  if (!result.delivery.ok) {
    return {
      ok: false,
      email,
      message: `${result.delivery.message} You can still sign in with your current password.`
    };
  }

  const message =
    result.delivery.provider === "console"
      ? "A reset link was created in the development server console."
      : "If an account exists for this email, a reset link has been sent.";

  return { ok: true, email, message };
}

export async function resetPasswordAction(
  _state: PasswordResetFormState,
  formData: FormData
): Promise<PasswordResetFormState> {
  const parsed = resetPasswordSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Enter a valid new password." };
  }

  const result = await resetPasswordWithToken(parsed.data.token, parsed.data.password);
  if (!result.ok) {
    return { ok: false, message: result.message ?? "Password reset failed." };
  }

  try {
    await signIn("credentials", {
      email: result.email,
      password: parsed.data.password,
      redirect: false
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { ok: true, message: "Password updated. Sign in with your new password." };
    }

    throw error;
  }

  redirect("/dashboard");
}
