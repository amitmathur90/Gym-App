import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { prisma } from "@/config/prisma";
import { ApiError } from "@/utils/ApiError";
import { generateOtp, OTP_TTL_MINUTES } from "@/utils/otp";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "@/utils/jwt";
import { OtpPurpose } from "@prisma/client";

const SALT_ROUNDS = 10;

function issueTokens(userId: string, role: string) {
  return {
    accessToken: signAccessToken({ sub: userId, role }),
    refreshToken: signRefreshToken({ sub: userId, role }),
  };
}

async function issueOtp(userId: string, purpose: OtpPurpose) {
  const code = generateOtp();
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60_000);
  await prisma.otpCode.create({ data: { userId, code, purpose, expiresAt } });
  // NOTE: no SMS/email provider is wired up yet. In dev, the OTP is returned
  // in the API response (see auth.routes.ts) and logged to the console so
  // the flow is testable end-to-end. Wire a real provider (Twilio/SendGrid/etc.)
  // before shipping to production and stop returning the code in the response.
  console.log(`[OTP] purpose=${purpose} userId=${userId} code=${code}`);
  return code;
}

export async function signup(input: { name: string; email: string; phone?: string; password: string }) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw ApiError.conflict("An account with this email already exists");

  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      phone: input.phone,
      passwordHash,
    },
  });

  const devOtp = await issueOtp(user.id, OtpPurpose.SIGNUP);
  return { userId: user.id, devOtp };
}

export async function login(input: { email: string; password: string }) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user || !user.passwordHash) throw ApiError.unauthorized("Invalid email or password");

  const valid = await bcrypt.compare(input.password, user.passwordHash);
  if (!valid) throw ApiError.unauthorized("Invalid email or password");

  if (!user.emailVerified) {
    const devOtp = await issueOtp(user.id, OtpPurpose.SIGNUP);
    return { requiresVerification: true, userId: user.id, devOtp };
  }

  const tokens = issueTokens(user.id, user.role);
  return { requiresVerification: false, user: sanitizeUser(user), ...tokens };
}

export async function verifyOtp(input: { email: string; code: string; purpose: OtpPurpose }) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user) throw ApiError.notFound("User not found");

  const otp = await prisma.otpCode.findFirst({
    where: { userId: user.id, purpose: input.purpose, consumed: false },
    orderBy: { createdAt: "desc" },
  });
  if (!otp || otp.code !== input.code) throw ApiError.badRequest("Invalid OTP code");
  if (otp.expiresAt < new Date()) throw ApiError.badRequest("OTP code has expired");

  await prisma.otpCode.update({ where: { id: otp.id }, data: { consumed: true } });

  if (input.purpose === OtpPurpose.SIGNUP || input.purpose === OtpPurpose.LOGIN) {
    await prisma.user.update({ where: { id: user.id }, data: { emailVerified: true } });
  }

  const tokens = issueTokens(user.id, user.role);
  return { user: sanitizeUser(user), ...tokens };
}

export async function resendOtp(input: { email: string; purpose: OtpPurpose }) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user) throw ApiError.notFound("User not found");
  const devOtp = await issueOtp(user.id, input.purpose);
  return { devOtp };
}

export async function forgotPassword(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  // Always behave the same whether or not the user exists, to avoid leaking
  // which emails are registered.
  if (!user) return { devToken: undefined };

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 30 * 60_000);
  await prisma.passwordResetToken.create({ data: { userId: user.id, token, expiresAt } });
  console.log(`[PASSWORD RESET] userId=${user.id} token=${token}`);
  return { devToken: token };
}

export async function resetPassword(input: { token: string; newPassword: string }) {
  const record = await prisma.passwordResetToken.findUnique({ where: { token: input.token } });
  if (!record || record.usedAt || record.expiresAt < new Date()) {
    throw ApiError.badRequest("Invalid or expired reset token");
  }

  const passwordHash = await bcrypt.hash(input.newPassword, SALT_ROUNDS);
  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
    prisma.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
  ]);
  return { ok: true };
}

export async function socialLogin(input: { provider: "GOOGLE" | "APPLE"; idToken: string; name?: string; email?: string }) {
  // NOTE: This is a scaffold. Real verification of the idToken against
  // Google/Apple public keys (e.g. via google-auth-library or apple-signin-auth)
  // must be added before this is production-safe. For now we trust the
  // caller-supplied email/name, which is only acceptable in local development.
  if (!input.email) throw ApiError.badRequest("email is required until real token verification is wired up");

  let user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        name: input.name ?? input.email.split("@")[0],
        email: input.email,
        provider: input.provider,
        emailVerified: true,
      },
    });
  }

  const tokens = issueTokens(user.id, user.role);
  return { user: sanitizeUser(user), ...tokens };
}

export async function refresh(refreshToken: string) {
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw ApiError.unauthorized("Invalid or expired refresh token");
  }
  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user) throw ApiError.unauthorized("User not found");
  return issueTokens(user.id, user.role);
}

function sanitizeUser(user: { passwordHash: string | null; [key: string]: unknown }) {
  const { passwordHash, ...rest } = user;
  return rest;
}
