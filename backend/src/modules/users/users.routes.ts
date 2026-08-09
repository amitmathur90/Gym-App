import { Router } from "express";
import { requireAuth } from "@/middleware/auth";
import { prisma } from "@/config/prisma";
import { ApiError } from "@/utils/ApiError";

export const usersRouter = Router();
usersRouter.use(requireAuth);

usersRouter.get("/me", async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId! } });
  if (!user) throw ApiError.notFound("User not found");
  const { passwordHash, ...safe } = user;
  res.json(safe);
});

usersRouter.patch("/me", async (req, res) => {
  const { name, phone, avatarUrl } = req.body as { name?: string; phone?: string; avatarUrl?: string };
  const user = await prisma.user.update({
    where: { id: req.userId! },
    data: { name, phone, avatarUrl },
  });
  const { passwordHash, ...safe } = user;
  res.json(safe);
});

// Aggregated data for the member dashboard home screen: membership status,
// upcoming classes, a workout summary, and today's goal progress.
usersRouter.get("/me/dashboard", async (req, res) => {
  const userId = req.userId!;
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(startOfToday);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

  const [activeMembership, upcomingBookings, weeklyLogs, todayGoal] = await Promise.all([
    prisma.membership.findFirst({
      where: { userId, status: "ACTIVE" },
      include: { plan: true },
      orderBy: { endDate: "desc" },
    }),
    prisma.classBooking.findMany({
      where: { userId, status: "BOOKED", schedule: { startsAt: { gte: now } } },
      include: { schedule: { include: { gymClass: true } } },
      orderBy: { schedule: { startsAt: "asc" } },
      take: 5,
    }),
    prisma.workoutLog.findMany({
      where: { userId, completedAt: { gte: startOfWeek } },
      include: { exercise: true },
    }),
    prisma.dailyGoal.findUnique({ where: { userId_date: { userId, date: startOfToday } } }),
  ]);

  res.json({
    membershipStatus: activeMembership
      ? {
          planName: activeMembership.plan.name,
          status: activeMembership.status,
          endDate: activeMembership.endDate,
          daysRemaining: Math.ceil((activeMembership.endDate.getTime() - now.getTime()) / 86_400_000),
        }
      : null,
    upcomingClasses: upcomingBookings.map((b) => ({
      bookingId: b.id,
      className: b.schedule.gymClass.name,
      startsAt: b.schedule.startsAt,
    })),
    workoutSummary: {
      sessionsThisWeek: new Set(weeklyLogs.map((l) => l.completedAt.toDateString())).size,
      totalSetsThisWeek: weeklyLogs.reduce((sum, l) => sum + l.setsCompleted, 0),
    },
    dailyGoal: todayGoal ?? {
      targetCalories: null,
      targetWaterMl: null,
      targetWorkoutMinutes: null,
      caloriesLogged: 0,
      waterLoggedMl: 0,
      workoutMinutesLogged: 0,
    },
  });
});

export default usersRouter;
