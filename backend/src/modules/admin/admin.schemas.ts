import { z } from "zod";

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
  search: z.string().optional(),
});

export const updateMemberSchema = z.object({
  role: z.enum(["MEMBER", "TRAINER", "ADMIN"]).optional(),
  name: z.string().min(2).max(80).optional(),
  phone: z.string().min(7).max(20).optional(),
  assignedTrainerId: z.string().uuid().nullable().optional(),
});

const trainerProfessionalFields = {
  bio: z.string().max(2000).optional(),
  specialties: z.array(z.string()).optional().default([]),
  qualification: z.string().max(200).optional(),
  certifications: z.array(z.string()).optional().default([]),
  experienceYears: z.number().int().min(0).max(60).optional(),
  ratePerHour: z.number().min(0).optional(),
  salary: z.number().min(0).optional(),
  joiningDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  isActive: z.boolean().optional().default(true),
};

// Option B: convert an existing member (identified by userId) into a trainer.
export const convertMemberToTrainerSchema = z.object({
  userId: z.string().uuid(),
  ...trainerProfessionalFields,
  keepActiveMembership: z.boolean().optional().default(true),
});

// Option A: create a brand-new person (new User + Trainer) from scratch.
export const createNewTrainerSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  phone: z.string().min(7).max(20).optional(),
  password: z.string().min(8).max(72),
  avatarUrl: z.string().url().optional(),
  gender: z.string().max(30).optional(),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  address: z.string().max(500).optional(),
  emergencyContactName: z.string().max(120).optional(),
  emergencyContactPhone: z.string().max(20).optional(),
  ...trainerProfessionalFields,
});

export const updateTrainerSchema = z.object({
  bio: z.string().max(2000).optional(),
  specialties: z.array(z.string()).optional(),
  qualification: z.string().max(200).optional(),
  certifications: z.array(z.string()).optional(),
  experienceYears: z.number().int().min(0).max(60).optional(),
  ratePerHour: z.number().min(0).optional(),
  salary: z.number().min(0).optional(),
  joiningDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  isActive: z.boolean().optional(),
  // Personal fields live on User, but it's convenient to edit them from the
  // same trainer edit form.
  name: z.string().min(2).max(80).optional(),
  phone: z.string().min(7).max(20).optional(),
  avatarUrl: z.string().url().optional(),
  gender: z.string().max(30).optional(),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  address: z.string().max(500).optional(),
  emergencyContactName: z.string().max(120).optional(),
  emergencyContactPhone: z.string().max(20).optional(),
});

export const createAssignmentSchema = z.object({
  memberId: z.string().uuid(),
  trainingType: z.string().min(2).max(80),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  schedule: z.string().max(200).optional(),
  notes: z.string().max(1000).optional(),
});

export const updateAssignmentSchema = z.object({
  status: z.enum(["ACTIVE", "COMPLETED", "CANCELLED"]).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  notes: z.string().max(1000).optional(),
});

export const createAvailabilitySchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  label: z.string().max(60).optional(),
});

export const createHolidaySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reason: z.string().max(200).optional(),
});

export const createPlanSchema = z.object({
  name: z.string().min(2).max(80),
  description: z.string().max(500).optional(),
  durationDays: z.number().int().min(1),
  price: z.number().min(0),
  perks: z.array(z.string()).optional().default([]),
});

export const updatePlanSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  description: z.string().max(500).optional(),
  durationDays: z.number().int().min(1).optional(),
  price: z.number().min(0).optional(),
  perks: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

export const createClassSchema = z.object({
  name: z.string().min(2).max(80),
  type: z.enum(["YOGA", "ZUMBA", "HIIT", "CROSSFIT", "PILATES", "SPIN"]),
  description: z.string().max(500).optional(),
  trainerId: z.string().uuid().optional(),
  capacity: z.number().int().min(1).max(200).optional().default(20),
  durationMin: z.number().int().min(10).max(240).optional().default(60),
});

export const updateClassSchema = createClassSchema.partial();

export const createScheduleSchema = z.object({
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
});

export const createFoodItemSchema = z.object({
  name: z.string().min(2).max(120),
  mealType: z.enum(["BREAKFAST", "LUNCH", "DINNER", "SNACK"]),
  calories: z.number().int().min(0).max(5000),
  carbsG: z.number().min(0).max(1000),
  proteinG: z.number().min(0).max(1000),
  fatsG: z.number().min(0).max(1000),
  servingLabel: z.string().min(1).max(60),
});

export const updateFoodItemSchema = createFoodItemSchema.partial();

export const createDietPlanSchema = z.object({
  memberId: z.string().uuid(),
  trainerId: z.string().uuid().optional(),
  name: z.string().min(2).max(80),
  notes: z.string().max(1000).optional(),
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
