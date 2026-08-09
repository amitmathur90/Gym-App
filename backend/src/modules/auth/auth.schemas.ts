import { z } from "zod";

export const signupSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  phone: z.string().min(7).max(20).optional(),
  password: z.string().min(8).max(72),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const verifyOtpSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
  purpose: z.enum(["SIGNUP", "LOGIN", "RESET_PASSWORD"]),
});

export const resendOtpSchema = z.object({
  email: z.string().email(),
  purpose: z.enum(["SIGNUP", "LOGIN", "RESET_PASSWORD"]),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(10),
  newPassword: z.string().min(8).max(72),
});

export const socialLoginSchema = z.object({
  provider: z.enum(["GOOGLE", "APPLE"]),
  idToken: z.string().min(10),
  name: z.string().min(2).max(80).optional(),
  email: z.string().email().optional(),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(10),
});
