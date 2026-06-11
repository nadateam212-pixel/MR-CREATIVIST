import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters.")
});

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters.").max(80),
  email: z.email("Enter a valid email address."),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .regex(/[A-Z]/, "Use at least one uppercase letter.")
    .regex(/[0-9]/, "Use at least one number."),
  referral: z
    .string()
    .trim()
    .max(40, "Referral code is too long.")
    .optional()
});

export const forgotPasswordSchema = z.object({
  email: z.email("Enter a valid email address.")
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(24, "Reset token is invalid."),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters.")
      .regex(/[A-Z]/, "Use at least one uppercase letter.")
      .regex(/[0-9]/, "Use at least one number."),
    confirmPassword: z.string().min(8, "Confirm your new password.")
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match."
  });

export const postCreateSchema = z.object({
  title: z.string().min(3).max(140),
  excerpt: z.string().max(240).optional(),
  content: z.string().min(10),
  categoryId: z.string().min(1).max(120).optional()
});

export const cursorQuerySchema = z.object({
  cursor: z.string().min(1).optional(),
  take: z.coerce.number().int().min(1).max(50).default(10)
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
