import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/config/prisma";
import { requireAuth, requireRole } from "@/middleware/auth";
import { validateBody, validateQuery } from "@/middleware/validate";
import { ApiError } from "@/utils/ApiError";
import {
  convertMemberToTrainerSchema,
  createNewTrainerSchema,
  updateTrainerSchema,
  createAssignmentSchema,
  updateAssignmentSchema,
  createAvailabilitySchema,
  createHolidaySchema,
} from "./admin.schemas";

export const adminTrainersRouter = Router();
adminTrainersRouter.use(requireAuth, requireRole("ADMIN"));

const SALT_ROUNDS = 10;
const userSummarySelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  avatarUrl: true,
  gender: true,
  dateOfBirth: true,
  address: true,
  emergencyContactName: true,
  emergencyContactPhone: true,
  createdAt: true,
} as const;

// ------------------------------------------------------------------
// Trainer List
// ------------------------------------------------------------------

adminTrainersRouter.get("/", async (_req, res) => {
  const trainers = await prisma.trainer.findMany({
    include: {
      user: { select: userSummarySelect },
      _count: { select: { members: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  res.json(trainers);
});

// ------------------------------------------------------------------
// Add Trainer — Option A: create a brand-new person from scratch.
// ------------------------------------------------------------------

adminTrainersRouter.post("/new", validateBody(createNewTrainerSchema), async (req, res) => {
  const body = req.body as z.infer<typeof createNewTrainerSchema>;

  const existing = await prisma.user.findUnique({ where: { email: body.email } });
  if (existing) throw ApiError.conflict("A user with this email already exists");

  const passwordHash = await bcrypt.hash(body.password, SALT_ROUNDS);

  const trainer = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name: body.name,
        email: body.email,
        phone: body.phone,
        passwordHash,
        role: "TRAINER",
        emailVerified: true,
        avatarUrl: body.avatarUrl,
        gender: body.gender,
        dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : undefined,
        address: body.address,
        emergencyContactName: body.emergencyContactName,
        emergencyContactPhone: body.emergencyContactPhone,
      },
    });
    return tx.trainer.create({
      data: {
        userId: user.id,
        bio: body.bio,
        specialties: body.specialties,
        qualification: body.qualification,
        certifications: body.certifications,
        experienceYears: body.experienceYears,
        ratePerHour: body.ratePerHour,
        salary: body.salary,
        joiningDate: body.joiningDate ? new Date(body.joiningDate) : undefined,
        isActive: body.isActive,
      },
      include: { user: { select: userSummarySelect } },
    });
  });

  res.status(201).json(trainer);
});

// ------------------------------------------------------------------
// Add Trainer — Option B: convert an existing member. Reuses their
// existing User row (no duplicate account) and just adds a Trainer
// profile + flips their role.
// ------------------------------------------------------------------

adminTrainersRouter.post("/", validateBody(convertMemberToTrainerSchema), async (req, res) => {
  const body = req.body as z.infer<typeof convertMemberToTrainerSchema>;

  const user = await prisma.user.findUnique({ where: { id: body.userId } });
  if (!user) throw ApiError.notFound("Member not found");

  const existingTrainer = await prisma.trainer.findUnique({ where: { userId: body.userId } });
  if (existingTrainer) throw ApiError.conflict("This user already has a trainer profile");

  const trainer = await prisma.$transaction(async (tx) => {
    const created = await tx.trainer.create({
      data: {
        userId: body.userId,
        bio: body.bio,
        specialties: body.specialties,
        qualification: body.qualification,
        certifications: body.certifications,
        experienceYears: body.experienceYears,
        ratePerHour: body.ratePerHour,
        salary: body.salary,
        joiningDate: body.joiningDate ? new Date(body.joiningDate) : undefined,
        isActive: body.isActive,
      },
      include: { user: { select: userSummarySelect } },
    });

    // Role is single-valued in this system, so "assign trainer role" always
    // means the user's role becomes TRAINER (there's no separate flag to
    // keep both roles simultaneously).
    await tx.user.update({ where: { id: body.userId }, data: { role: "TRAINER" } });

    if (!body.keepActiveMembership) {
      await tx.membership.updateMany({
        where: { userId: body.userId, status: "ACTIVE" },
        data: { status: "CANCELLED" },
      });
    }

    return created;
  });

  res.status(201).json(trainer);
});

// ------------------------------------------------------------------
// Trainer Profile
// ------------------------------------------------------------------

adminTrainersRouter.get("/:id", async (req, res) => {
  const trainer = await prisma.trainer.findUnique({
    where: { id: req.params.id },
    include: {
      user: { select: userSummarySelect },
      _count: { select: { members: true } },
    },
  });
  if (!trainer) throw ApiError.notFound("Trainer not found");

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);

  const [activeMembers, dietPlansCreated, recentAssignments, assignments] = await Promise.all([
    prisma.user.count({ where: { assignedTrainerId: trainer.id } }),
    prisma.dietPlan.count({ where: { trainerId: trainer.id } }),
    prisma.trainerAssignment.findMany({
      where: { trainerId: trainer.id, createdAt: { gte: sixMonthsAgo } },
      select: { createdAt: true },
    }),
    prisma.trainerAssignment.findMany({
      where: { trainerId: trainer.id },
      include: { member: { select: { id: true, name: true, email: true, phone: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const byMonth = new Map<string, number>();
  for (const a of recentAssignments) {
    const key = `${a.createdAt.getFullYear()}-${String(a.createdAt.getMonth() + 1).padStart(2, "0")}`;
    byMonth.set(key, (byMonth.get(key) ?? 0) + 1);
  }

  res.json({
    ...trainer,
    performance: {
      totalMembersAssigned: trainer._count.members,
      activeMembers,
      dietPlansCreated,
      monthlyAssignments: [...byMonth.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([month, count]) => ({
        month,
        count,
      })),
      // Not tracked yet in this build — no ratings/reviews or attendance
      // check-in system exists. Surfaced explicitly rather than faked.
      averageRating: null,
      attendanceRate: null,
    },
    assignments,
  });
});

adminTrainersRouter.patch("/:id", validateBody(updateTrainerSchema), async (req, res) => {
  const body = req.body as z.infer<typeof updateTrainerSchema>;
  const trainer = await prisma.trainer.findUnique({ where: { id: req.params.id } });
  if (!trainer) throw ApiError.notFound("Trainer not found");

  const {
    name,
    phone,
    avatarUrl,
    gender,
    dateOfBirth,
    address,
    emergencyContactName,
    emergencyContactPhone,
    joiningDate,
    ...trainerFields
  } = body;

  const [, updated] = await prisma.$transaction([
    prisma.user.update({
      where: { id: trainer.userId },
      data: {
        name,
        phone,
        avatarUrl,
        gender,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        address,
        emergencyContactName,
        emergencyContactPhone,
      },
    }),
    prisma.trainer.update({
      where: { id: trainer.id },
      data: { ...trainerFields, joiningDate: joiningDate ? new Date(joiningDate) : undefined },
      include: { user: { select: userSummarySelect } },
    }),
  ]);

  res.json(updated);
});

adminTrainersRouter.delete("/:id", async (req, res) => {
  const trainer = await prisma.trainer.findUnique({ where: { id: req.params.id } });
  if (!trainer) throw ApiError.notFound("Trainer not found");
  await prisma.trainer.delete({ where: { id: trainer.id } });
  res.status(204).end();
});

// ------------------------------------------------------------------
// Assign Members
// ------------------------------------------------------------------

adminTrainersRouter.post("/:id/assignments", validateBody(createAssignmentSchema), async (req, res) => {
  const trainerId = req.params.id;
  const body = req.body as z.infer<typeof createAssignmentSchema>;

  const [trainer, member] = await Promise.all([
    prisma.trainer.findUnique({ where: { id: trainerId } }),
    prisma.user.findUnique({ where: { id: body.memberId } }),
  ]);
  if (!trainer) throw ApiError.notFound("Trainer not found");
  if (!member) throw ApiError.notFound("Member not found");

  const [assignment] = await prisma.$transaction([
    prisma.trainerAssignment.create({
      data: {
        trainerId,
        memberId: body.memberId,
        trainingType: body.trainingType,
        startDate: new Date(body.startDate),
        endDate: body.endDate ? new Date(body.endDate) : undefined,
        schedule: body.schedule,
        notes: body.notes,
      },
      include: { member: { select: { id: true, name: true, email: true, phone: true } } },
    }),
    prisma.user.update({ where: { id: body.memberId }, data: { assignedTrainerId: trainerId } }),
  ]);

  res.status(201).json(assignment);
});

adminTrainersRouter.get("/:id/assignments", async (req, res) => {
  const assignments = await prisma.trainerAssignment.findMany({
    where: { trainerId: req.params.id },
    include: { member: { select: { id: true, name: true, email: true, phone: true } } },
    orderBy: { createdAt: "desc" },
  });
  res.json(assignments);
});

adminTrainersRouter.patch("/assignments/:assignmentId", validateBody(updateAssignmentSchema), async (req, res) => {
  const body = req.body as z.infer<typeof updateAssignmentSchema>;
  const assignment = await prisma.trainerAssignment.update({
    where: { id: req.params.assignmentId },
    data: { ...body, endDate: body.endDate ? new Date(body.endDate) : undefined },
    include: { member: { select: { id: true, name: true, email: true, phone: true } } },
  });

  // If this assignment is no longer active, and it was the member's current
  // assignedTrainerId, clear that quick-lookup pointer.
  if (assignment.status !== "ACTIVE") {
    await prisma.user.updateMany({
      where: { id: assignment.memberId, assignedTrainerId: assignment.trainerId },
      data: { assignedTrainerId: null },
    });
  }

  res.json(assignment);
});

// ------------------------------------------------------------------
// Trainer Schedule — availability blocks, PT sessions, group classes,
// holidays, and (derived) weekly off days.
// ------------------------------------------------------------------

adminTrainersRouter.get("/:id/schedule", async (req, res) => {
  const trainerId = req.params.id;
  const now = new Date();
  const in30Days = new Date(now.getTime() + 30 * 86_400_000);

  const [availability, holidays, upcomingBookings, upcomingClasses] = await Promise.all([
    prisma.trainerAvailability.findMany({ where: { trainerId }, orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }] }),
    prisma.trainerHoliday.findMany({ where: { trainerId, date: { gte: now } }, orderBy: { date: "asc" } }),
    prisma.personalTrainerBooking.findMany({
      where: { trainerId, status: "CONFIRMED", startTime: { gte: now, lte: in30Days } },
      orderBy: { startTime: "asc" },
    }),
    prisma.classSchedule.findMany({
      where: { gymClass: { trainerId }, startsAt: { gte: now, lte: in30Days } },
      include: { gymClass: { select: { name: true, type: true } } },
      orderBy: { startsAt: "asc" },
    }),
  ]);

  const daysWithAvailability = new Set(availability.map((a) => a.dayOfWeek));
  const weeklyOffDays = [0, 1, 2, 3, 4, 5, 6].filter((d) => !daysWithAvailability.has(d));

  res.json({ availability, holidays, upcomingBookings, upcomingClasses, weeklyOffDays });
});

adminTrainersRouter.post("/:id/availability", validateBody(createAvailabilitySchema), async (req, res) => {
  const block = await prisma.trainerAvailability.create({
    data: { trainerId: req.params.id, ...(req.body as z.infer<typeof createAvailabilitySchema>) },
  });
  res.status(201).json(block);
});

adminTrainersRouter.delete("/availability/:availabilityId", async (req, res) => {
  await prisma.trainerAvailability.delete({ where: { id: req.params.availabilityId } });
  res.status(204).end();
});

adminTrainersRouter.post("/:id/holidays", validateBody(createHolidaySchema), async (req, res) => {
  const { date, reason } = req.body as z.infer<typeof createHolidaySchema>;
  const holiday = await prisma.trainerHoliday.create({
    data: { trainerId: req.params.id, date: new Date(date), reason },
  });
  res.status(201).json(holiday);
});

adminTrainersRouter.delete("/holidays/:holidayId", async (req, res) => {
  await prisma.trainerHoliday.delete({ where: { id: req.params.holidayId } });
  res.status(204).end();
});

export default adminTrainersRouter;
