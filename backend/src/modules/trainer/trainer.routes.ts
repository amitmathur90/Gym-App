import { Router, RequestHandler } from "express";
import { z } from "zod";
import { prisma } from "@/config/prisma";
import { requireAuth, requireRole } from "@/middleware/auth";
import { validateBody, validateQuery } from "@/middleware/validate";
import { ApiError } from "@/utils/ApiError";
import {
  scheduleRangeSchema,
  assignWorkoutPlanSchema,
  updateWorkoutPlanSchema,
  duplicateWorkoutPlanSchema,
  createDietPlanSchema,
  createMeasurementSchema,
  createProgressPhotoSchema,
  createSessionSchema,
  updateSessionSchema,
  sendMessageSchema,
} from "./trainer.schemas";

export const trainerRouter = Router();

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      trainerId?: string;
    }
  }
}

trainerRouter.use(requireAuth, requireRole("TRAINER"));

// Resolves the caller's own Trainer profile once, so every handler below
// can just read req.trainerId instead of re-querying it.
const resolveOwnTrainer: RequestHandler = async (req, _res, next) => {
  const trainer = await prisma.trainer.findUnique({ where: { userId: req.userId! } });
  if (!trainer) throw ApiError.forbidden("This account has no trainer profile");
  req.trainerId = trainer.id;
  next();
};
trainerRouter.use(resolveOwnTrainer);

async function assertOwnMember(trainerId: string, memberId: string) {
  const isAssigned = await prisma.user.findFirst({ where: { id: memberId, assignedTrainerId: trainerId } });
  if (!isAssigned) throw ApiError.forbidden("This member is not assigned to you");
}

const memberSummarySelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  avatarUrl: true,
  gender: true,
  dateOfBirth: true,
} as const;

// ------------------------------------------------------------------
// Profile & Dashboard
// ------------------------------------------------------------------

trainerRouter.get("/me", async (req, res) => {
  const trainer = await prisma.trainer.findUnique({
    where: { id: req.trainerId! },
    include: { user: { select: memberSummarySelect } },
  });
  res.json(trainer);
});

trainerRouter.get("/dashboard", async (req, res) => {
  const trainerId = req.trainerId!;
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(startOfToday.getTime() + 86_400_000);
  const in7Days = new Date(now.getTime() + 7 * 86_400_000);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalAssignedMembers,
    todaysSessions,
    upcomingSessions,
    pendingWorkoutPlans,
    completedSessionsToday,
    unreadMessages,
    monthlyAssignments,
  ] = await Promise.all([
    prisma.user.count({ where: { assignedTrainerId: trainerId } }),
    prisma.personalTrainerBooking.count({
      where: { trainerId, startTime: { gte: startOfToday, lt: endOfToday } },
    }),
    prisma.personalTrainerBooking.count({
      where: { trainerId, status: "UPCOMING", startTime: { gte: now, lte: in7Days } },
    }),
    prisma.workoutPlan.count({ where: { trainerId, status: "DRAFT" } }),
    prisma.personalTrainerBooking.count({
      where: { trainerId, status: "COMPLETED", startTime: { gte: startOfToday, lt: endOfToday } },
    }),
    prisma.message.count({ where: { receiverId: req.userId!, readAt: null } }),
    prisma.trainerAssignment.count({ where: { trainerId, createdAt: { gte: startOfMonth } } }),
  ]);

  res.json({
    totalAssignedMembers,
    todaysSessions,
    upcomingSessions,
    pendingWorkoutPlans,
    completedSessionsToday,
    unreadMessages,
    newAssignmentsThisMonth: monthlyAssignments,
    // Not tracked yet — no ratings system exists.
    averageRating: null,
  });
});

// ------------------------------------------------------------------
// Today's Schedule / Sessions
// ------------------------------------------------------------------

function rangeToWindow(range: "today" | "tomorrow" | "week") {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (range === "today") return { gte: startOfToday, lt: new Date(startOfToday.getTime() + 86_400_000) };
  if (range === "tomorrow") {
    const start = new Date(startOfToday.getTime() + 86_400_000);
    return { gte: start, lt: new Date(start.getTime() + 86_400_000) };
  }
  return { gte: startOfToday, lt: new Date(startOfToday.getTime() + 7 * 86_400_000) };
}

trainerRouter.get("/schedule", validateQuery(scheduleRangeSchema), async (req, res) => {
  const { range } = req.query as unknown as z.infer<typeof scheduleRangeSchema>;
  const window = rangeToWindow(range);

  const sessions = await prisma.personalTrainerBooking.findMany({
    where: { trainerId: req.trainerId!, startTime: window },
    include: { member: { select: memberSummarySelect } },
    orderBy: { startTime: "asc" },
  });
  res.json(sessions);
});

trainerRouter.post("/sessions", validateBody(createSessionSchema), async (req, res) => {
  const body = req.body as z.infer<typeof createSessionSchema>;
  await assertOwnMember(req.trainerId!, body.memberId);
  if (new Date(body.endTime) <= new Date(body.startTime)) throw ApiError.badRequest("endTime must be after startTime");

  const session = await prisma.personalTrainerBooking.create({
    data: {
      trainerId: req.trainerId!,
      userId: body.memberId,
      startTime: new Date(body.startTime),
      endTime: new Date(body.endTime),
      sessionType: body.sessionType,
      notes: body.notes,
    },
    include: { member: { select: memberSummarySelect } },
  });
  res.status(201).json(session);
});

trainerRouter.patch("/sessions/:id", validateBody(updateSessionSchema), async (req, res) => {
  const body = req.body as z.infer<typeof updateSessionSchema>;
  const session = await prisma.personalTrainerBooking.findFirst({
    where: { id: req.params.id, trainerId: req.trainerId! },
  });
  if (!session) throw ApiError.notFound("Session not found");

  const updated = await prisma.personalTrainerBooking.update({
    where: { id: session.id },
    data: {
      status: body.status,
      startTime: body.startTime ? new Date(body.startTime) : undefined,
      endTime: body.endTime ? new Date(body.endTime) : undefined,
      notes: body.notes,
    },
    include: { member: { select: memberSummarySelect } },
  });
  res.json(updated);
});

// ------------------------------------------------------------------
// Assigned Members
// ------------------------------------------------------------------

trainerRouter.get("/members", async (req, res) => {
  const trainerId = req.trainerId!;
  const now = new Date();

  const members = await prisma.user.findMany({
    where: { assignedTrainerId: trainerId },
    select: {
      ...memberSummarySelect,
      memberships: {
        where: { status: "ACTIVE" },
        select: { plan: { select: { name: true } } },
        take: 1,
        orderBy: { endDate: "desc" },
      },
      trainerAssignments: {
        where: { trainerId, status: "ACTIVE" },
        select: { trainingType: true },
        take: 1,
        orderBy: { createdAt: "desc" },
      },
      workoutLogs: { select: { completedAt: true }, orderBy: { completedAt: "desc" }, take: 1 },
    },
  });

  const memberIds = members.map((m) => m.id);
  const [nextSessions, weekLogCounts] = await Promise.all([
    prisma.personalTrainerBooking.findMany({
      where: { trainerId, userId: { in: memberIds }, status: "UPCOMING", startTime: { gte: now } },
      orderBy: { startTime: "asc" },
    }),
    prisma.workoutLog.groupBy({
      by: ["userId"],
      where: {
        userId: { in: memberIds },
        completedAt: { gte: new Date(now.getTime() - 7 * 86_400_000) },
      },
      _count: { _all: true },
    }),
  ]);

  const nextSessionByMember = new Map<string, Date>();
  for (const s of nextSessions) {
    if (!nextSessionByMember.has(s.userId)) nextSessionByMember.set(s.userId, s.startTime);
  }
  const weekLogCountByMember = new Map(weekLogCounts.map((g) => [g.userId, g._count._all]));

  res.json(
    members.map((m) => ({
      id: m.id,
      name: m.name,
      email: m.email,
      phone: m.phone,
      avatarUrl: m.avatarUrl,
      membershipPlan: m.memberships[0]?.plan.name ?? null,
      goal: m.trainerAssignments[0]?.trainingType ?? null,
      lastVisit: m.workoutLogs[0]?.completedAt ?? null,
      // Real, honestly-scoped proxy metric: how many of a nominal 3
      // sessions/week the member logged in the last 7 days, capped at 100%.
      // This is workout-log consistency, not a general "progress" score —
      // labeled as such in the UI.
      weeklyConsistencyPct: Math.min(100, Math.round(((weekLogCountByMember.get(m.id) ?? 0) / 3) * 100)),
      nextSession: nextSessionByMember.get(m.id) ?? null,
    }))
  );
});

trainerRouter.get("/members/:id", async (req, res) => {
  await assertOwnMember(req.trainerId!, req.params.id);

  const member = await prisma.user.findUnique({
    where: { id: req.params.id },
    select: {
      ...memberSummarySelect,
      address: true,
      emergencyContactName: true,
      emergencyContactPhone: true,
      memberships: { include: { plan: true }, orderBy: { createdAt: "desc" }, take: 1 },
      trainerAssignments: { where: { trainerId: req.trainerId! }, orderBy: { createdAt: "desc" } },
    },
  });
  if (!member) throw ApiError.notFound("Member not found");
  res.json(member);
});

// ------------------------------------------------------------------
// Workout Plans
// ------------------------------------------------------------------

trainerRouter.get("/workout-plans", async (req, res) => {
  const plans = await prisma.workoutPlan.findMany({
    where: { trainerId: req.trainerId! },
    include: {
      member: { select: { id: true, name: true, email: true } },
      exercises: { include: { exercise: true }, orderBy: { order: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  });
  res.json(plans);
});

trainerRouter.post("/workout-plans/assign", validateBody(assignWorkoutPlanSchema), async (req, res) => {
  const body = req.body as z.infer<typeof assignWorkoutPlanSchema>;
  const trainerId = req.trainerId!;

  for (const memberId of body.memberIds) {
    await assertOwnMember(trainerId, memberId);
  }

  const created = await prisma.$transaction(
    body.memberIds.flatMap((memberId) =>
      body.days.map((day) =>
        prisma.workoutPlan.create({
          data: {
            userId: memberId,
            trainerId,
            name: day.name,
            dayOfWeek: day.dayOfWeek,
            status: body.status,
            notes: body.notes,
            exercises: {
              create: day.exercises.map((e, idx) => ({
                exerciseId: e.exerciseId,
                sets: e.sets,
                reps: e.reps,
                restSeconds: e.restSeconds,
                videoUrl: e.videoUrl,
                notes: e.notes,
                order: e.order ?? idx,
              })),
            },
          },
        })
      )
    )
  );

  res.status(201).json({ createdCount: created.length });
});

trainerRouter.patch("/workout-plans/:id", validateBody(updateWorkoutPlanSchema), async (req, res) => {
  const plan = await prisma.workoutPlan.findFirst({ where: { id: req.params.id, trainerId: req.trainerId! } });
  if (!plan) throw ApiError.notFound("Workout plan not found");

  const updated = await prisma.workoutPlan.update({
    where: { id: plan.id },
    data: req.body as z.infer<typeof updateWorkoutPlanSchema>,
    include: { exercises: { include: { exercise: true } }, member: { select: { name: true } } },
  });
  res.json(updated);
});

trainerRouter.delete("/workout-plans/:id", async (req, res) => {
  const plan = await prisma.workoutPlan.findFirst({ where: { id: req.params.id, trainerId: req.trainerId! } });
  if (!plan) throw ApiError.notFound("Workout plan not found");
  await prisma.workoutPlan.delete({ where: { id: plan.id } });
  res.status(204).end();
});

trainerRouter.post("/workout-plans/:id/duplicate", validateBody(duplicateWorkoutPlanSchema), async (req, res) => {
  const trainerId = req.trainerId!;
  const source = await prisma.workoutPlan.findFirst({
    where: { id: req.params.id, trainerId },
    include: { exercises: true },
  });
  if (!source) throw ApiError.notFound("Workout plan not found");

  const { memberIds } = req.body as z.infer<typeof duplicateWorkoutPlanSchema>;
  const targets = memberIds && memberIds.length > 0 ? memberIds : [source.userId];
  for (const memberId of targets) {
    await assertOwnMember(trainerId, memberId);
  }

  const created = await prisma.$transaction(
    targets.map((memberId) =>
      prisma.workoutPlan.create({
        data: {
          userId: memberId,
          trainerId,
          name: `${source.name} (copy)`,
          dayOfWeek: source.dayOfWeek,
          status: "DRAFT",
          notes: source.notes,
          exercises: {
            create: source.exercises.map((e) => ({
              exerciseId: e.exerciseId,
              sets: e.sets,
              reps: e.reps,
              restSeconds: e.restSeconds,
              videoUrl: e.videoUrl,
              notes: e.notes,
              order: e.order,
            })),
          },
        },
      })
    )
  );
  res.status(201).json({ createdCount: created.length });
});

// ------------------------------------------------------------------
// Diet Plans (trainer-scoped)
// ------------------------------------------------------------------

trainerRouter.get("/diet-plans", async (req, res) => {
  const plans = await prisma.dietPlan.findMany({
    where: { trainerId: req.trainerId! },
    include: {
      member: { select: { id: true, name: true, email: true } },
      meals: { include: { foodItem: true }, orderBy: [{ dayOfWeek: "asc" }] },
    },
    orderBy: { createdAt: "desc" },
  });
  res.json(plans);
});

trainerRouter.post("/diet-plans", validateBody(createDietPlanSchema), async (req, res) => {
  const body = req.body as z.infer<typeof createDietPlanSchema>;
  await assertOwnMember(req.trainerId!, body.memberId);

  const plan = await prisma.dietPlan.create({
    data: {
      memberId: body.memberId,
      trainerId: req.trainerId!,
      name: body.name,
      notes: body.notes,
      targetWaterMl: body.targetWaterMl,
      supplements: body.supplements,
      meals: { create: body.meals },
    },
    include: { meals: { include: { foodItem: true } }, member: { select: { name: true } } },
  });
  res.status(201).json(plan);
});

trainerRouter.delete("/diet-plans/:id", async (req, res) => {
  const plan = await prisma.dietPlan.findFirst({ where: { id: req.params.id, trainerId: req.trainerId! } });
  if (!plan) throw ApiError.notFound("Diet plan not found");
  await prisma.dietPlan.delete({ where: { id: plan.id } });
  res.status(204).end();
});

// ------------------------------------------------------------------
// Member Progress: body measurements & photos
// ------------------------------------------------------------------

trainerRouter.get("/members/:memberId/measurements", async (req, res) => {
  await assertOwnMember(req.trainerId!, req.params.memberId);
  const measurements = await prisma.bodyMeasurement.findMany({
    where: { memberId: req.params.memberId },
    orderBy: { recordedAt: "asc" },
  });
  res.json(measurements);
});

trainerRouter.post(
  "/members/:memberId/measurements",
  validateBody(createMeasurementSchema),
  async (req, res) => {
    await assertOwnMember(req.trainerId!, req.params.memberId);
    const body = req.body as z.infer<typeof createMeasurementSchema>;
    const measurement = await prisma.bodyMeasurement.create({
      data: {
        memberId: req.params.memberId,
        trainerId: req.trainerId!,
        ...body,
        recordedAt: body.recordedAt ? new Date(body.recordedAt) : undefined,
      },
    });
    res.status(201).json(measurement);
  }
);

// Read-only view of a member's water intake for the trainer to monitor
// compliance — the member is still the only one who can log entries
// (via /api/nutrition), this just surfaces what they've already logged.
trainerRouter.get("/members/:memberId/water", async (req, res) => {
  await assertOwnMember(req.trainerId!, req.params.memberId);
  const memberId = req.params.memberId;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const start = new Date(today.getTime() - 6 * 86_400_000);

  const goals = await prisma.dailyGoal.findMany({
    where: { userId: memberId, date: { gte: start, lte: today } },
    select: { date: true, waterLoggedMl: true, targetWaterMl: true },
  });
  const byDate = new Map(goals.map((g) => [g.date.toISOString().slice(0, 10), g.waterLoggedMl]));
  const todayKey = today.toISOString().slice(0, 10);
  const todayGoal = goals.find((g) => g.date.toISOString().slice(0, 10) === todayKey);

  const weekly = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start.getTime() + i * 86_400_000);
    const key = d.toISOString().slice(0, 10);
    weekly.push({ date: key, waterLoggedMl: byDate.get(key) ?? 0 });
  }

  res.json({
    todayWaterMl: todayGoal?.waterLoggedMl ?? 0,
    targetWaterMl: todayGoal?.targetWaterMl ?? 2500,
    weekly,
  });
});

trainerRouter.get("/members/:memberId/photos", async (req, res) => {
  await assertOwnMember(req.trainerId!, req.params.memberId);
  const photos = await prisma.progressPhoto.findMany({
    where: { memberId: req.params.memberId },
    orderBy: { takenAt: "desc" },
  });
  res.json(photos);
});

trainerRouter.post(
  "/members/:memberId/photos",
  validateBody(createProgressPhotoSchema),
  async (req, res) => {
    await assertOwnMember(req.trainerId!, req.params.memberId);
    const body = req.body as z.infer<typeof createProgressPhotoSchema>;
    const photo = await prisma.progressPhoto.create({
      data: {
        memberId: req.params.memberId,
        trainerId: req.trainerId!,
        photoUrl: body.photoUrl,
        type: body.type,
        takenAt: body.takenAt ? new Date(body.takenAt) : undefined,
      },
    });
    res.status(201).json(photo);
  }
);

// ------------------------------------------------------------------
// Alerts feed — computed on demand rather than a persisted/pushed
// notification system (no job scheduler or push infra exists yet).
// ------------------------------------------------------------------

trainerRouter.get("/alerts", async (req, res) => {
  const trainerId = req.trainerId!;
  const now = new Date();
  const in7Days = new Date(now.getTime() + 7 * 86_400_000);
  const in14Days = new Date(now.getTime() + 14 * 86_400_000);
  const in24h = new Date(now.getTime() + 86_400_000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 86_400_000);

  const [newAssignments, expiringMemberships, upcomingSessions, draftPlans, members] = await Promise.all([
    prisma.trainerAssignment.findMany({
      where: { trainerId, createdAt: { gte: sevenDaysAgo } },
      include: { member: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.membership.findMany({
      where: { status: "ACTIVE", endDate: { gte: now, lte: in7Days }, user: { assignedTrainerId: trainerId } },
      include: { user: { select: { name: true } } },
    }),
    prisma.personalTrainerBooking.findMany({
      where: { trainerId, status: "UPCOMING", startTime: { gte: now, lte: in24h } },
      include: { member: { select: { name: true } } },
    }),
    prisma.workoutPlan.findMany({
      where: { trainerId, status: "DRAFT" },
      include: { member: { select: { name: true } } },
    }),
    prisma.user.findMany({
      where: { assignedTrainerId: trainerId, dateOfBirth: { not: null } },
      select: { id: true, name: true, dateOfBirth: true },
    }),
  ]);

  const upcomingBirthdays = members.filter((m) => {
    if (!m.dateOfBirth) return false;
    const dob = new Date(m.dateOfBirth);
    const nextBirthday = new Date(now.getFullYear(), dob.getMonth(), dob.getDate());
    if (nextBirthday < now) nextBirthday.setFullYear(now.getFullYear() + 1);
    return nextBirthday <= in14Days;
  });

  const alerts = [
    ...newAssignments.map((a) => ({
      type: "NEW_MEMBER_ASSIGNED",
      message: `${a.member.name} was assigned to you`,
      createdAt: a.createdAt,
    })),
    ...expiringMemberships.map((m) => ({
      type: "MEMBERSHIP_EXPIRING",
      message: `${m.user.name}'s membership expires ${new Date(m.endDate).toLocaleDateString()}`,
      createdAt: now,
    })),
    ...upcomingSessions.map((s) => ({
      type: "APPOINTMENT_REMINDER",
      message: `Session with ${s.member.name} at ${new Date(s.startTime).toLocaleString()}`,
      createdAt: now,
    })),
    ...draftPlans.map((p) => ({
      type: "WORKOUT_DUE",
      message: `Draft workout plan "${p.name}" for ${p.member.name} needs to be activated`,
      createdAt: now,
    })),
    ...upcomingBirthdays.map((m) => ({
      type: "BIRTHDAY_REMINDER",
      message: `${m.name}'s birthday is coming up`,
      createdAt: now,
    })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json(alerts);
});

// ------------------------------------------------------------------
// Messages — text + image/document link, polling-based (no WebSocket
// infra exists yet, so the client refetches periodically).
// ------------------------------------------------------------------

trainerRouter.get("/messages/:memberId", async (req, res) => {
  await assertOwnMember(req.trainerId!, req.params.memberId);
  const myUserId = req.userId!;
  const otherId = req.params.memberId;

  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: myUserId, receiverId: otherId },
        { senderId: otherId, receiverId: myUserId },
      ],
    },
    orderBy: { createdAt: "asc" },
  });

  await prisma.message.updateMany({
    where: { senderId: otherId, receiverId: myUserId, readAt: null },
    data: { readAt: new Date() },
  });

  res.json(messages);
});

trainerRouter.post("/messages", validateBody(sendMessageSchema), async (req, res) => {
  const body = req.body as z.infer<typeof sendMessageSchema>;
  await assertOwnMember(req.trainerId!, body.receiverId);
  if (!body.body && !body.attachmentUrl) throw ApiError.badRequest("Message needs text or an attachment");

  const message = await prisma.message.create({
    data: { senderId: req.userId!, ...body },
  });
  res.status(201).json(message);
});

// ------------------------------------------------------------------
// Reports
// ------------------------------------------------------------------

trainerRouter.get("/reports/members.csv", async (req, res) => {
  const members = await prisma.user.findMany({
    where: { assignedTrainerId: req.trainerId! },
    select: {
      name: true,
      email: true,
      phone: true,
      trainerAssignments: {
        where: { trainerId: req.trainerId! },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { trainingType: true, startDate: true, status: true },
      },
    },
  });

  const header = "Name,Email,Phone,Training Type,Start Date,Status\n";
  const rows = members
    .map((m) => {
      const a = m.trainerAssignments[0];
      const cells = [
        m.name,
        m.email,
        m.phone ?? "",
        a?.trainingType ?? "",
        a ? new Date(a.startDate).toISOString().slice(0, 10) : "",
        a?.status ?? "",
      ];
      return cells.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",");
    })
    .join("\n");

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", 'attachment; filename="assigned-members.csv"');
  res.send(header + rows);
});

export default trainerRouter;
