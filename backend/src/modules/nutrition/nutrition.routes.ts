import { Router } from "express";
import { z } from "zod";
import { prisma } from "@/config/prisma";
import { requireAuth } from "@/middleware/auth";
import { validateBody, validateQuery } from "@/middleware/validate";
import { ApiError } from "@/utils/ApiError";
import { logMealSchema, logWaterSchema, updateTargetsSchema, dateQuerySchema } from "./nutrition.schemas";
import { startOfDay, endOfDay, getOrCreateDailyGoal, recomputeNutritionTotals } from "./nutrition.service";

export const nutritionRouter = Router();

// Public: browse the food catalog.
nutritionRouter.get(
  "/foods",
  validateQuery(z.object({ mealType: z.enum(["BREAKFAST", "LUNCH", "DINNER", "SNACK"]).optional() })),
  async (req, res) => {
    const { mealType } = req.query as { mealType?: string };
    const foods = await prisma.foodItem.findMany({ where: mealType ? { mealType: mealType as never } : undefined });
    res.json(foods);
  }
);

nutritionRouter.use(requireAuth);

nutritionRouter.get("/summary", validateQuery(dateQuerySchema), async (req, res) => {
  const userId = req.userId!;
  const date = startOfDay((req.query as { date?: string }).date);

  const [goal, meals] = await Promise.all([
    getOrCreateDailyGoal(userId, date),
    prisma.mealLog.findMany({
      where: { userId, loggedAt: { gte: date, lt: endOfDay(date) } },
      include: { foodItem: true },
      orderBy: { loggedAt: "asc" },
    }),
  ]);

  res.json({ goal, meals });
});

// The member's most recently assigned diet plan (set by a trainer/admin),
// with meals grouped for a weekly view.
nutritionRouter.get("/diet-plan", async (req, res) => {
  const plan = await prisma.dietPlan.findFirst({
    where: { memberId: req.userId! },
    include: {
      trainer: { include: { user: { select: { name: true } } } },
      meals: { include: { foodItem: true }, orderBy: [{ dayOfWeek: "asc" }] },
    },
    orderBy: { createdAt: "desc" },
  });
  res.json(plan);
});

nutritionRouter.get("/meals", validateQuery(dateQuerySchema), async (req, res) => {
  const userId = req.userId!;
  const date = startOfDay((req.query as { date?: string }).date);

  const meals = await prisma.mealLog.findMany({
    where: { userId, loggedAt: { gte: date, lt: endOfDay(date) } },
    include: { foodItem: true },
    orderBy: { loggedAt: "asc" },
  });
  res.json(meals);
});

nutritionRouter.post("/meals", validateBody(logMealSchema), async (req, res) => {
  const userId = req.userId!;
  const { foodItemId, mealType, servings } = req.body as z.infer<typeof logMealSchema>;

  const foodItem = await prisma.foodItem.findUnique({ where: { id: foodItemId } });
  if (!foodItem) throw ApiError.notFound("Food item not found");

  const log = await prisma.mealLog.create({
    data: { userId, foodItemId, mealType, servings },
    include: { foodItem: true },
  });

  await recomputeNutritionTotals(userId, startOfDay());
  res.status(201).json(log);
});

nutritionRouter.delete("/meals/:id", async (req, res) => {
  const userId = req.userId!;
  const log = await prisma.mealLog.findFirst({ where: { id: req.params.id, userId } });
  if (!log) throw ApiError.notFound("Meal log not found");

  await prisma.mealLog.delete({ where: { id: log.id } });
  await recomputeNutritionTotals(userId, startOfDay(log.loggedAt.toISOString().slice(0, 10)));
  res.status(204).end();
});

nutritionRouter.patch("/water", validateBody(logWaterSchema), async (req, res) => {
  const userId = req.userId!;
  const { amountMl } = req.body as z.infer<typeof logWaterSchema>;
  const date = startOfDay();

  await getOrCreateDailyGoal(userId, date);
  const goal = await prisma.dailyGoal.update({
    where: { userId_date: { userId, date } },
    data: { waterLoggedMl: { increment: amountMl } },
  });
  res.json(goal);
});

// Last 7 days (including today) of water intake, oldest first, for the
// Water Tracker's weekly chart. Days with no DailyGoal row yet are filled
// in as 0 rather than requiring one to exist.
nutritionRouter.get("/water/weekly", async (req, res) => {
  const userId = req.userId!;
  const today = startOfDay();
  const start = new Date(today.getTime() - 6 * 86_400_000);

  const goals = await prisma.dailyGoal.findMany({
    where: { userId, date: { gte: start, lte: today } },
    select: { date: true, waterLoggedMl: true },
  });
  const byDate = new Map(goals.map((g) => [g.date.toISOString().slice(0, 10), g.waterLoggedMl]));

  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start.getTime() + i * 86_400_000);
    const key = d.toISOString().slice(0, 10);
    days.push({ date: key, waterLoggedMl: byDate.get(key) ?? 0 });
  }

  res.json(days);
});

nutritionRouter.patch("/targets", validateBody(updateTargetsSchema), async (req, res) => {
  const userId = req.userId!;
  const date = startOfDay();
  const updates = req.body as z.infer<typeof updateTargetsSchema>;

  await getOrCreateDailyGoal(userId, date);
  const goal = await prisma.dailyGoal.update({
    where: { userId_date: { userId, date } },
    data: updates,
  });
  res.json(goal);
});

export default nutritionRouter;
