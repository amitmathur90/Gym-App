import { z } from "zod";

export const createWorkoutPlanSchema = z.object({
  programId: z.string().uuid().optional(),
  name: z.string().min(2).max(80),
  dayOfWeek: z.number().int().min(0).max(6),
  exercises: z
    .array(
      z.object({
        exerciseId: z.string().uuid(),
        sets: z.number().int().min(1).max(20),
        reps: z.number().int().min(1).max(100),
        restSeconds: z.number().int().min(0).max(600).optional(),
        order: z.number().int().min(0).optional(),
      })
    )
    .min(1),
});

export const logWorkoutSchema = z.object({
  exerciseId: z.string().uuid(),
  setsCompleted: z.number().int().min(1),
  repsCompleted: z.number().int().min(1),
  weightKg: z.number().min(0).optional(),
});
