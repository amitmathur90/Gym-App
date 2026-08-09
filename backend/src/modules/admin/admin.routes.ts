import { Router } from "express";
import multer from "multer";
import { z } from "zod";
import { prisma } from "@/config/prisma";
import { requireAuth, requireRole } from "@/middleware/auth";
import { validateBody, validateQuery } from "@/middleware/validate";
import { ApiError } from "@/utils/ApiError";
import {
  paginationSchema,
  updateMemberSchema,
  createPlanSchema,
  updatePlanSchema,
  createClassSchema,
  updateClassSchema,
  createScheduleSchema,
  createDietPlanSchema,
  createFoodItemSchema,
  updateFoodItemSchema,
} from "./admin.schemas";

export const adminRouter = Router();

adminRouter.use(requireAuth, requireRole("ADMIN"));

// ------------------------------------------------------------------
// Dashboard
// ------------------------------------------------------------------

adminRouter.get("/dashboard", async (_req, res) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today.getTime() + 86_400_000);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const last14Days = new Date(today.getTime() - 13 * 86_400_000);
  const soonCutoff = new Date(now.getTime() + 7 * 86_400_000);

  const [
    totalMembers,
    activeMemberships,
    totalTrainers,
    newMembersThisMonth,
    monthlyRevenueAgg,
    totalRevenueAgg,
    upcomingClassesCount,
    membershipStatusRaw,
    recentSignups,
    recentMembers,
    recentPayments,
    todaysScheduleRaw,
    trainers,
    duesExpiringSoonCount,
    pendingPaymentsCount,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "MEMBER" } }),
    prisma.membership.count({ where: { status: "ACTIVE" } }),
    prisma.trainer.count(),
    prisma.user.count({ where: { role: "MEMBER", createdAt: { gte: startOfMonth } } }),
    prisma.payment.aggregate({
      where: { status: "SUCCESS", createdAt: { gte: startOfMonth, lt: startOfNextMonth } },
      _sum: { amount: true },
    }),
    prisma.payment.aggregate({ where: { status: "SUCCESS" }, _sum: { amount: true } }),
    prisma.classSchedule.count({ where: { startsAt: { gte: now } } }),
    prisma.membership.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.user.findMany({
      where: { role: "MEMBER", createdAt: { gte: last14Days } },
      select: { createdAt: true },
    }),
    prisma.user.findMany({
      where: { role: "MEMBER" },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        memberships: {
          where: { status: "ACTIVE" },
          select: { plan: { select: { name: true } } },
          take: 1,
          orderBy: { endDate: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.payment.findMany({
      where: { status: "SUCCESS" },
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.classSchedule.findMany({
      where: { startsAt: { gte: today, lt: tomorrow } },
      include: { gymClass: { include: { trainer: { include: { user: { select: { name: true } } } } } } },
      orderBy: { startsAt: "asc" },
      take: 6,
    }),
    prisma.trainer.findMany({
      select: { id: true, user: { select: { name: true } }, _count: { select: { members: true } } },
      orderBy: { members: { _count: "desc" } },
      take: 5,
    }),
    prisma.membership.count({ where: { status: "ACTIVE", endDate: { gte: now, lte: soonCutoff } } }),
    prisma.payment.count({ where: { status: "PENDING" } }),
  ]);

  const signupsByDay = new Map<string, number>();
  for (let i = 0; i < 14; i++) {
    const d = new Date(last14Days.getTime() + i * 86_400_000);
    signupsByDay.set(d.toISOString().slice(0, 10), 0);
  }
  for (const s of recentSignups) {
    const key = s.createdAt.toISOString().slice(0, 10);
    signupsByDay.set(key, (signupsByDay.get(key) ?? 0) + 1);
  }

  res.json({
    totalMembers,
    activeMemberships,
    totalTrainers,
    newMembersThisMonth,
    monthlyRevenue: monthlyRevenueAgg._sum.amount ?? 0,
    totalRevenue: totalRevenueAgg._sum.amount ?? 0,
    upcomingClassesCount,
    duesExpiringSoonCount,
    pendingPaymentsCount,
    membershipStatusBreakdown: membershipStatusRaw.map((m) => ({ status: m.status, count: m._count._all })),
    signupsTrend: [...signupsByDay.entries()].map(([date, count]) => ({ date, count })),
    recentMembers: recentMembers.map((m) => ({
      id: m.id,
      name: m.name,
      email: m.email,
      createdAt: m.createdAt,
      planName: m.memberships[0]?.plan.name ?? null,
    })),
    recentPayments: recentPayments.map((p) => ({
      id: p.id,
      userName: p.user.name,
      amount: p.amount,
      status: p.status,
      createdAt: p.createdAt,
    })),
    todaysSchedule: todaysScheduleRaw.map((s) => ({
      id: s.id,
      className: s.gymClass.name,
      trainerName: s.gymClass.trainer?.user.name ?? null,
      startsAt: s.startsAt,
      endsAt: s.endsAt,
    })),
    topTrainers: trainers.map((t) => ({ id: t.id, name: t.user.name, memberCount: t._count.members })),
  });
});

// ------------------------------------------------------------------
// Member management
// ------------------------------------------------------------------

adminRouter.get("/members", validateQuery(paginationSchema), async (req, res) => {
  const { page, pageSize, search } = req.query as unknown as z.infer<typeof paginationSchema>;

  const where = search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { email: { contains: search, mode: "insensitive" as const } },
          { phone: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : undefined;

  const [members, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        emailVerified: true,
        createdAt: true,
        memberships: {
          where: { status: "ACTIVE" },
          select: { plan: { select: { name: true } }, endDate: true },
          take: 1,
          orderBy: { endDate: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.user.count({ where }),
  ]);

  res.json({ members, total, page, pageSize });
});

adminRouter.get("/members/:id", async (req, res) => {
  const member = await prisma.user.findUnique({
    where: { id: req.params.id },
    include: {
      memberships: { include: { plan: true }, orderBy: { createdAt: "desc" } },
      payments: { orderBy: { createdAt: "desc" }, take: 20 },
      assignedTrainer: { include: { user: { select: { name: true, email: true } } } },
    },
  });
  if (!member) throw ApiError.notFound("Member not found");
  const { passwordHash, ...safe } = member;
  res.json(safe);
});

adminRouter.patch("/members/:id", validateBody(updateMemberSchema), async (req, res) => {
  const member = await prisma.user.update({
    where: { id: req.params.id },
    data: req.body as z.infer<typeof updateMemberSchema>,
  });
  const { passwordHash, ...safe } = member;
  res.json(safe);
});

// ------------------------------------------------------------------
// Membership plans
// ------------------------------------------------------------------

adminRouter.get("/membership-plans", async (_req, res) => {
  const plans = await prisma.membershipPlan.findMany({ orderBy: { price: "asc" } });
  res.json(plans);
});

adminRouter.post("/membership-plans", validateBody(createPlanSchema), async (req, res) => {
  const plan = await prisma.membershipPlan.create({ data: req.body as z.infer<typeof createPlanSchema> });
  res.status(201).json(plan);
});

adminRouter.patch("/membership-plans/:id", validateBody(updatePlanSchema), async (req, res) => {
  const plan = await prisma.membershipPlan.update({
    where: { id: req.params.id },
    data: req.body as z.infer<typeof updatePlanSchema>,
  });
  res.json(plan);
});

// Soft delete — hides the plan from new purchases without touching past
// memberships/payments that reference it.
adminRouter.delete("/membership-plans/:id", async (req, res) => {
  await prisma.membershipPlan.update({ where: { id: req.params.id }, data: { isActive: false } });
  res.status(204).end();
});

// Permanent delete — only allowed when nothing references this plan, so it
// can never orphan a member's membership/payment history. Use for cleaning
// up plans created by mistake; use the soft delete above for retiring a
// plan that members have actually purchased.
adminRouter.delete("/membership-plans/:id/permanently", async (req, res) => {
  const membershipCount = await prisma.membership.count({ where: { planId: req.params.id } });
  if (membershipCount > 0) {
    throw ApiError.conflict(
      `Can't permanently delete — ${membershipCount} membership${membershipCount === 1 ? "" : "s"} still reference this plan. Archive it instead.`
    );
  }
  await prisma.membershipPlan.delete({ where: { id: req.params.id } });
  res.status(204).end();
});

// ------------------------------------------------------------------
// Food library — the shared FoodItem catalog that diet-plan builders
// (here and in the trainer app) and member meal logging all pick from.
// ------------------------------------------------------------------

adminRouter.get(
  "/foods",
  validateQuery(z.object({ mealType: z.enum(["BREAKFAST", "LUNCH", "DINNER", "SNACK"]).optional() })),
  async (req, res) => {
    const { mealType } = req.query as { mealType?: string };
    const foods = await prisma.foodItem.findMany({
      where: mealType ? { mealType: mealType as never } : undefined,
      orderBy: [{ mealType: "asc" }, { name: "asc" }],
    });
    res.json(foods);
  }
);

adminRouter.post("/foods", validateBody(createFoodItemSchema), async (req, res) => {
  const food = await prisma.foodItem.create({ data: req.body as z.infer<typeof createFoodItemSchema> });
  res.status(201).json(food);
});

adminRouter.patch("/foods/:id", validateBody(updateFoodItemSchema), async (req, res) => {
  const food = await prisma.foodItem.findUnique({ where: { id: req.params.id } });
  if (!food) throw ApiError.notFound("Food item not found");

  const updated = await prisma.foodItem.update({
    where: { id: req.params.id },
    data: req.body as z.infer<typeof updateFoodItemSchema>,
  });
  res.json(updated);
});

adminRouter.delete("/foods/:id", async (req, res) => {
  const food = await prisma.foodItem.findUnique({ where: { id: req.params.id } });
  if (!food) throw ApiError.notFound("Food item not found");

  const [mealLogCount, dietPlanMealCount] = await Promise.all([
    prisma.mealLog.count({ where: { foodItemId: req.params.id } }),
    prisma.dietPlanMeal.count({ where: { foodItemId: req.params.id } }),
  ]);
  if (mealLogCount > 0 || dietPlanMealCount > 0) {
    throw ApiError.conflict("This food is already used in meal logs or diet plans and can't be deleted.");
  }

  await prisma.foodItem.delete({ where: { id: req.params.id } });
  res.status(204).end();
});

// ------------------------------------------------------------------
// Diet plans — structured plans assigned to a member by a trainer/admin,
// distinct from the member's own free-form meal logging.
// ------------------------------------------------------------------

adminRouter.get(
  "/diet-plans",
  validateQuery(z.object({ memberId: z.string().uuid().optional() })),
  async (req, res) => {
    const { memberId } = req.query as { memberId?: string };
    const plans = await prisma.dietPlan.findMany({
      where: memberId ? { memberId } : undefined,
      include: {
        member: { select: { id: true, name: true, email: true } },
        trainer: { include: { user: { select: { name: true } } } },
        meals: { include: { foodItem: true }, orderBy: [{ dayOfWeek: "asc" }] },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(plans);
  }
);

adminRouter.post("/diet-plans", validateBody(createDietPlanSchema), async (req, res) => {
  const { memberId, trainerId, name, notes, meals } = req.body as z.infer<typeof createDietPlanSchema>;

  const member = await prisma.user.findUnique({ where: { id: memberId } });
  if (!member) throw ApiError.notFound("Member not found");

  const plan = await prisma.dietPlan.create({
    data: {
      memberId,
      trainerId,
      name,
      notes,
      meals: { create: meals },
    },
    include: { meals: { include: { foodItem: true } }, member: { select: { name: true, email: true } } },
  });
  res.status(201).json(plan);
});

adminRouter.delete("/diet-plans/:id", async (req, res) => {
  await prisma.dietPlan.delete({ where: { id: req.params.id } });
  res.status(204).end();
});

// ------------------------------------------------------------------
// Class scheduling
// ------------------------------------------------------------------

adminRouter.get("/classes", async (_req, res) => {
  const classes = await prisma.gymClass.findMany({
    include: {
      trainer: { include: { user: { select: { name: true } } } },
      schedules: { orderBy: { startsAt: "asc" }, include: { _count: { select: { bookings: true } } } },
    },
    orderBy: { name: "asc" },
  });
  res.json(classes);
});

adminRouter.post("/classes", validateBody(createClassSchema), async (req, res) => {
  const gymClass = await prisma.gymClass.create({ data: req.body as z.infer<typeof createClassSchema> });
  res.status(201).json(gymClass);
});

adminRouter.patch("/classes/:id", validateBody(updateClassSchema), async (req, res) => {
  const gymClass = await prisma.gymClass.update({
    where: { id: req.params.id },
    data: req.body as z.infer<typeof updateClassSchema>,
  });
  res.json(gymClass);
});

adminRouter.delete("/classes/:id", async (req, res) => {
  await prisma.gymClass.delete({ where: { id: req.params.id } });
  res.status(204).end();
});

adminRouter.post("/classes/:id/schedules", validateBody(createScheduleSchema), async (req, res) => {
  const { startsAt, endsAt } = req.body as z.infer<typeof createScheduleSchema>;
  if (new Date(endsAt) <= new Date(startsAt)) throw ApiError.badRequest("endsAt must be after startsAt");

  const schedule = await prisma.classSchedule.create({
    data: { classId: req.params.id, startsAt: new Date(startsAt), endsAt: new Date(endsAt) },
  });
  res.status(201).json(schedule);
});

adminRouter.delete("/schedules/:id", async (req, res) => {
  await prisma.classSchedule.delete({ where: { id: req.params.id } });
  res.status(204).end();
});

// ------------------------------------------------------------------
// Payments & revenue reports
// ------------------------------------------------------------------

adminRouter.get("/payments", validateQuery(paginationSchema), async (req, res) => {
  const { page, pageSize } = req.query as unknown as z.infer<typeof paginationSchema>;

  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      include: {
        user: { select: { name: true, email: true } },
        membership: { include: { plan: { select: { name: true } } } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.payment.count(),
  ]);

  res.json({ payments, total, page, pageSize });
});

adminRouter.get("/reports/revenue", async (_req, res) => {
  const successPayments = await prisma.payment.findMany({
    where: { status: "SUCCESS" },
    select: { amount: true, createdAt: true, membership: { select: { plan: { select: { name: true } } } } },
  });

  const byMonth = new Map<string, number>();
  const byPlan = new Map<string, number>();

  for (const p of successPayments) {
    const monthKey = `${p.createdAt.getFullYear()}-${String(p.createdAt.getMonth() + 1).padStart(2, "0")}`;
    byMonth.set(monthKey, (byMonth.get(monthKey) ?? 0) + Number(p.amount));

    const planName = p.membership?.plan.name ?? "Other";
    byPlan.set(planName, (byPlan.get(planName) ?? 0) + Number(p.amount));
  }

  res.json({
    totalRevenue: successPayments.reduce((sum, p) => sum + Number(p.amount), 0),
    byMonth: [...byMonth.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([month, total]) => ({ month, total })),
    byPlan: [...byPlan.entries()].map(([planName, total]) => ({ planName, total })),
  });
});

// Members whose membership needs payment attention: renewals coming up in
// the next 7 days, and memberships already past their end date that were
// never renewed (still stored as ACTIVE — there's no cron to flip them to
// EXPIRED — plus any explicitly marked EXPIRED).
adminRouter.get("/reports/dues", async (_req, res) => {
  const now = new Date();
  const soonCutoff = new Date(now.getTime() + 7 * 86_400_000);

  const [dueSoon, overdue] = await Promise.all([
    prisma.membership.findMany({
      where: { status: "ACTIVE", endDate: { gte: now, lte: soonCutoff } },
      include: { user: { select: { id: true, name: true, email: true, phone: true } }, plan: true },
      orderBy: { endDate: "asc" },
    }),
    prisma.membership.findMany({
      where: {
        OR: [{ status: "ACTIVE", endDate: { lt: now } }, { status: "EXPIRED" }],
      },
      include: { user: { select: { id: true, name: true, email: true, phone: true } }, plan: true },
      orderBy: { endDate: "desc" },
    }),
  ]);

  const shape = (m: (typeof dueSoon)[number]) => ({
    membershipId: m.id,
    member: m.user,
    planName: m.plan.name,
    amountDue: m.plan.price,
    endDate: m.endDate,
    autoRenew: m.autoRenew,
  });

  res.json({ dueSoon: dueSoon.map(shape), overdue: overdue.map(shape) });
});

// ------------------------------------------------------------------
// Branding settings
// ------------------------------------------------------------------

// Stored as base64 data URLs / plain text in the DB (not on disk) since
// Render's free-tier filesystem is wiped on every deploy.
const LOGIN_BACKGROUND_KEY = "login_background";
const LOGIN_LOGO_KEY = "login_logo";
const SITE_TITLE_KEY = "site_title";
const SITE_DESCRIPTION_KEY = "site_description";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 4 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) return cb(new Error("Only image files are allowed"));
    cb(null, true);
  },
});

async function setImageSetting(key: string, file: Express.Multer.File | undefined) {
  if (!file) throw ApiError.badRequest("No image uploaded");
  const dataUrl = `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;
  await prisma.setting.upsert({ where: { key }, create: { key, value: dataUrl }, update: { value: dataUrl } });
  return dataUrl;
}

adminRouter.post("/settings/login-background", upload.single("image"), async (req, res) => {
  const dataUrl = await setImageSetting(LOGIN_BACKGROUND_KEY, req.file);
  res.json({ loginBackground: dataUrl });
});

adminRouter.delete("/settings/login-background", async (_req, res) => {
  await prisma.setting.deleteMany({ where: { key: LOGIN_BACKGROUND_KEY } });
  res.status(204).send();
});

adminRouter.post("/settings/logo", upload.single("image"), async (req, res) => {
  const dataUrl = await setImageSetting(LOGIN_LOGO_KEY, req.file);
  res.json({ logo: dataUrl });
});

adminRouter.delete("/settings/logo", async (_req, res) => {
  await prisma.setting.deleteMany({ where: { key: LOGIN_LOGO_KEY } });
  res.status(204).send();
});

const brandingTextSchema = z.object({
  siteTitle: z.string().trim().max(80).optional(),
  siteDescription: z.string().trim().max(300).optional(),
});

adminRouter.put("/settings/branding-text", validateBody(brandingTextSchema), async (req, res) => {
  const { siteTitle, siteDescription } = req.body as z.infer<typeof brandingTextSchema>;
  await Promise.all([
    siteTitle !== undefined
      ? prisma.setting.upsert({
          where: { key: SITE_TITLE_KEY },
          create: { key: SITE_TITLE_KEY, value: siteTitle },
          update: { value: siteTitle },
        })
      : Promise.resolve(),
    siteDescription !== undefined
      ? prisma.setting.upsert({
          where: { key: SITE_DESCRIPTION_KEY },
          create: { key: SITE_DESCRIPTION_KEY, value: siteDescription },
          update: { value: siteDescription },
        })
      : Promise.resolve(),
  ]);
  res.json({ siteTitle, siteDescription });
});

export default adminRouter;
export { LOGIN_BACKGROUND_KEY, LOGIN_LOGO_KEY, SITE_TITLE_KEY, SITE_DESCRIPTION_KEY };
