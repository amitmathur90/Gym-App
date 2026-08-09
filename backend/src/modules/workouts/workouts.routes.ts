import { Router } from "express";
import { prisma } from "@/config/prisma";
import { requireAuth } from "@/middleware/auth";
import { validateBody, validateQuery } from "@/middleware/validate";
import { ApiError } from "@/utils/ApiError";
import { createWorkoutPlanSchema, logWorkoutSchema } from "./workouts.schemas";
import { z } from "zod";

export const workoutsRouter = Router();

// Public: browse programs by level and the exercise library.
workoutsRouter.get(
  "/programs",
  validateQuery(z.object({ level: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]).optional() })),
  async (req, res) => {
    const { level } = req.query as { level?: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" };
    const programs = await prisma.workoutProgram.findMany({ where: level ? { level } : undefined });
    res.json(programs);
  }
);

workoutsRouter.get("/exercises", async (req, res) => {
  const { muscleGroup } = req.query as { muscleGroup?: string };
  const exercises = await prisma.exercise.findMany({ where: muscleGroup ? { muscleGroup } : undefined });
  res.json(exercises);
});

workoutsRouter.get("/exercises/:id", async (req, res) => {
  const exercise = await prisma.exercise.findUnique({ where: { id: req.params.id } });
  if (!exercise) throw ApiError.notFound("Exercise not found");
  res.json(exercise);
});

workoutsRouter.use(requireAuth);

// Personalized workout plans for the current user.
workoutsRouter.get("/plans", async (req, res) => {
  const plans = await prisma.workoutPlan.findMany({
    where: { userId: req.userId! },
    include: { exercises: { include: { exercise: true }, orderBy: { order: "asc" } }, program: true },
    orderBy: { dayOfWeek: "asc" },
  });
  res.json(plans);
});

workoutsRouter.post("/plans", validateBody(createWorkoutPlanSchema), async (req, res) => {
  const userId = req.userId!;
  const { name, dayOfWeek, programId, exercises } = req.body as z.infer<typeof createWorkoutPlanSchema>;

  const plan = await prisma.workoutPlan.create({
    data: {
      userId,
      name,
      dayOfWeek,
      programId,
      exercises: {
        create: exercises.map((e, idx) => ({
          exerciseId: e.exerciseId,
          sets: e.sets,
          reps: e.reps,
          restSeconds: e.restSeconds ?? 60,
          order: e.order ?? idx,
        })),
      },
    },
    include: { exercises: { include: { exercise: true } } },
  });

  res.status(201).json(plan);
});

workoutsRouter.delete("/plans/:id", async (req, res) => {
  const plan = await prisma.workoutPlan.findFirst({ where: { id: req.params.id, userId: req.userId! } });
  if (!plan) throw ApiError.notFound("Workout plan not found");
  await prisma.workoutPlan.delete({ where: { id: plan.id } });
  res.status(204).end();
});

// Workout tracking: log completed sets/reps for progress charts.
workoutsRouter.post("/logs", validateBody(logWorkoutSchema), async (req, res) => {
  const log = await prisma.workoutLog.create({
    data: { userId: req.userId!, ...(req.body as z.infer<typeof logWorkoutSchema>) },
  });
  res.status(201).json(log);
});

workoutsRouter.get(
  "/logs",
  validateQuery(z.object({ from: z.string().datetime().optional(), to: z.string().datetime().optional() })),
  async (req, res) => {
    const { from, to } = req.query as { from?: string; to?: string };
    const logs = await prisma.workoutLog.findMany({
      where: {
        userId: req.userId!,
        completedAt: { gte: from ? new Date(from) : undefined, lte: to ? new Date(to) : undefined },
      },
      include: { exercise: true },
      orderBy: { completedAt: "desc" },
    });
    res.json(logs);
  }
);

export default workoutsRouter;
