import { Router } from "express";
import { validateBody } from "@/middleware/validate";
import {
  signupSchema,
  loginSchema,
  verifyOtpSchema,
  resendOtpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  socialLoginSchema,
  refreshSchema,
} from "./auth.schemas";
import * as authService from "./auth.service";

export const authRouter = Router();

authRouter.post("/signup", validateBody(signupSchema), async (req, res) => {
  const result = await authService.signup(req.body);
  res.status(201).json(result);
});

authRouter.post("/login", validateBody(loginSchema), async (req, res) => {
  const result = await authService.login(req.body);
  res.json(result);
});

authRouter.post("/otp/verify", validateBody(verifyOtpSchema), async (req, res) => {
  const result = await authService.verifyOtp(req.body);
  res.json(result);
});

authRouter.post("/otp/resend", validateBody(resendOtpSchema), async (req, res) => {
  const result = await authService.resendOtp(req.body);
  res.json(result);
});

authRouter.post("/password/forgot", validateBody(forgotPasswordSchema), async (req, res) => {
  const result = await authService.forgotPassword(req.body.email);
  res.json(result);
});

authRouter.post("/password/reset", validateBody(resetPasswordSchema), async (req, res) => {
  const result = await authService.resetPassword(req.body);
  res.json(result);
});

authRouter.post("/social", validateBody(socialLoginSchema), async (req, res) => {
  const result = await authService.socialLogin(req.body);
  res.json(result);
});

authRouter.post("/refresh", validateBody(refreshSchema), async (req, res) => {
  const result = await authService.refresh(req.body.refreshToken);
  res.json(result);
});
