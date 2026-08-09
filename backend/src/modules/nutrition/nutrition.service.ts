import { prisma } from "@/config/prisma";

export function startOfDay(dateStr?: string): Date {
  if (dateStr) {
    const [year, month, day] = dateStr.split("-").map(Number);
    return new Date(year, month - 1, day);
  }
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export function endOfDay(start: Date): Date {
  return new Date(start.getTime() + 86_400_000);
}

export async function getOrCreateDailyGoal(userId: string, date: Date) {
  return prisma.dailyGoal.upsert({
    where: { userId_date: { userId, date } },
    update: {},
    create: { userId, date },
  });
}

/** Recomputes calories/macros logged for [date, date+1) from MealLog and stores them on DailyGoal. */
export async function recomputeNutritionTotals(userId: string, date: Date) {
  const logs = await prisma.mealLog.findMany({
    where: { userId, loggedAt: { gte: date, lt: endOfDay(date) } },
    include: { foodItem: true },
  });

  const totals = logs.reduce(
    (acc, log) => {
      acc.calories += Math.round(log.foodItem.calories * log.servings);
      acc.carbsG += Math.round(log.foodItem.carbsG * log.servings);
      acc.proteinG += Math.round(log.foodItem.proteinG * log.servings);
      acc.fatsG += Math.round(log.foodItem.fatsG * log.servings);
      return acc;
    },
    { calories: 0, carbsG: 0, proteinG: 0, fatsG: 0 }
  );

  await getOrCreateDailyGoal(userId, date);
  return prisma.dailyGoal.update({
    where: { userId_date: { userId, date } },
    data: {
      caloriesLogged: totals.calories,
      carbsLoggedG: totals.carbsG,
      proteinLoggedG: totals.proteinG,
      fatsLoggedG: totals.fatsG,
    },
  });
}
