import { Router } from "express";
import { prisma } from "@/config/prisma";
import {
  LOGIN_BACKGROUND_KEY,
  LOGIN_LOGO_KEY,
  SITE_TITLE_KEY,
  SITE_DESCRIPTION_KEY,
} from "@/modules/admin/admin.routes";

export const publicRouter = Router();

// Unauthenticated — the login screen needs this before anyone signs in.
publicRouter.get("/branding", async (_req, res) => {
  const settings = await prisma.setting.findMany({
    where: { key: { in: [LOGIN_BACKGROUND_KEY, LOGIN_LOGO_KEY, SITE_TITLE_KEY, SITE_DESCRIPTION_KEY] } },
  });
  const byKey = new Map(settings.map((s) => [s.key, s.value]));
  res.json({
    loginBackground: byKey.get(LOGIN_BACKGROUND_KEY) ?? null,
    logo: byKey.get(LOGIN_LOGO_KEY) ?? null,
    siteTitle: byKey.get(SITE_TITLE_KEY) ?? null,
    siteDescription: byKey.get(SITE_DESCRIPTION_KEY) ?? null,
  });
});

export default publicRouter;
