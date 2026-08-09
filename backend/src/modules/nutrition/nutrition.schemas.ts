import { z } from "zod";

const mealTypeSchema = z.enum(["BREAKFAST", "LUNCH", "DINNER", "SNACK"]);

export const logMealSchema = z.object({
  foodItemId: z.string().uuid(),
  mealType: mealTypeSchema,
  servings: z.number().min(0.25).max(20).optional().default(1),
});

export const logWaterSchema = z.object({
  amountMl: z.number().int().min(1).max(5000),
});

export const updateTargetsSchema = z.object({
  targetCalories: z.number().int().min(0).max(10000).optional(),
  targetCarbsG: z.number().int().min(0).max(2000).optional(),
  targetProteinG: z.number().int().min(0).max(2000).optional(),
  targetFatsG: z.number().int().min(0).max(2000).optional(),
  targetWaterMl: z.number().int().min(0).max(20000).optional(),
});

export const dateQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});
