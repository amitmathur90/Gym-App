import { z } from "zod";

export const scheduleRangeSchema = z.object({
  range: z.enum(["today", "tomorrow", "week"]).optional().default("today"),
});

const exerciseEntrySchema = z.object({
  exerciseId: z.string().uuid(),
  sets: z.number().int().min(1).max(20),
  reps: z.number().int().min(1).max(100),
  restSeconds: z.number().int().min(0).max(600).optional().default(60),
  videoUrl: z.string().url().optional(),
  notes: z.string().max(300).optional(),
  order: z.number().int().min(0).optional(),
});

const dayEntrySchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  name: z.string().min(1).max(80),
  exercises: z.array(exerciseEntrySchema).min(1),
});

export const assignWorkoutPlanSchema = z.object({
  memberIds: z.array(z.string().uuid()).min(1),
  days: z.array(dayEntrySchema).min(1),
  status: z.enum(["DRAFT", "ACTIVE", "COMPLETED"]).optional().default("ACTIVE"),
  notes: z.string().max(1000).optional(),
});

export const updateWorkoutPlanSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  status: z.enum(["DRAFT", "ACTIVE", "COMPLETED"]).optional(),
  notes: z.string().max(1000).optional(),
});

export const duplicateWorkoutPlanSchema = z.object({
  memberIds: z.array(z.string().uuid()).min(1).optional(),
});

export const createDietPlanSchema = z.object({
  memberId: z.string().uuid(),
  name: z.string().min(2).max(80),
  notes: z.string().max(1000).optional(),
  targetWaterMl: z.number().int().min(0).max(20000).optional(),
  supplements: z.string().max(500).optional(),
  meals: z
    .array(
      z.object({
        foodItemId: z.string().uuid(),
        mealType: z.enum(["BREAKFAST", "LUNCH", "DINNER", "SNACK"]),
        dayOfWeek: z.number().int().min(0).max(6),
        notes: z.string().max(300).optional(),
      })
    )
    .min(1),
});

export const createMeasurementSchema = z.object({
  weightKg: z.number().min(0).max(400).optional(),
  bmi: z.number().min(0).max(100).optional(),
  bodyFatPct: z.number().min(0).max(100).optional(),
  chestCm: z.number().min(0).max(300).optional(),
  waistCm: z.number().min(0).max(300).optional(),
  armsCm: z.number().min(0).max(300).optional(),
  thighsCm: z.number().min(0).max(300).optional(),
  shouldersCm: z.number().min(0).max(300).optional(),
  notes: z.string().max(500).optional(),
  recordedAt: z.string().datetime().optional(),
});

export const createProgressPhotoSchema = z.object({
  photoUrl: z.string().url(),
  type: z.enum(["BEFORE", "AFTER", "PROGRESS"]),
  takenAt: z.string().datetime().optional(),
});

export const createSessionSchema = z.object({
  memberId: z.string().uuid(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  sessionType: z.string().max(80).optional(),
  notes: z.string().max(500).optional(),
});

export const updateSessionSchema = z.object({
  status: z.enum(["UPCOMING", "IN_PROGRESS", "COMPLETED", "PENDING", "CANCELLED"]).optional(),
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
  notes: z.string().max(500).optional(),
});

export const sendMessageSchema = z.object({
  receiverId: z.string().uuid(),
  body: z.string().max(4000).optional(),
  attachmentUrl: z.string().url().optional(),
  attachmentType: z.enum(["IMAGE", "DOCUMENT"]).optional(),
});
