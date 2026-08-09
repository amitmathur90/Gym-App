import { Router } from "express";
import { prisma } from "@/config/prisma";
import { LOGIN_BACKGROUND_KEY } from "@/modules/admin/admin.routes";

export const publicRouter = Router();

// Unauthenticated — the login screen needs this before anyone signs in.
publicRouter.get("/branding", async (_req, res) => {
  const setting = await prisma.setting.findUnique({ where: { key: LOGIN_BACKGROUND_KEY } });
  res.json({ loginBackground: setting?.value ?? null });
});

export default publicRouter;
