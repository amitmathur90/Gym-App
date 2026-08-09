import { Router } from "express";
import { prisma } from "@/config/prisma";
import { requireAuth } from "@/middleware/auth";
import { validateQuery } from "@/middleware/validate";
import { ApiError } from "@/utils/ApiError";
import { z } from "zod";

export const classesRouter = Router();

classesRouter.get(
  "/",
  validateQuery(
    z.object({ type: z.enum(["YOGA", "ZUMBA", "HIIT", "CROSSFIT", "PILATES", "SPIN"]).optional() })
  ),
  async (req, res) => {
    const { type } = req.query as { type?: string };
    const classes = await prisma.gymClass.findMany({
      where: type ? { type: type as never } : undefined,
      include: { trainer: { include: { user: { select: { name: true } } } } },
    });
    res.json(classes);
  }
);

classesRouter.get(
  "/schedules",
  validateQuery(
    z.object({
      classId: z.string().uuid().optional(),
      from: z.string().datetime().optional(),
      to: z.string().datetime().optional(),
    })
  ),
  async (req, res) => {
    const { classId, from, to } = req.query as { classId?: string; from?: string; to?: string };
    const schedules = await prisma.classSchedule.findMany({
      where: {
        classId,
        startsAt: { gte: from ? new Date(from) : new Date(), lte: to ? new Date(to) : undefined },
      },
      include: {
        gymClass: { include: { trainer: { include: { user: { select: { name: true } } } } } },
        _count: { select: { bookings: { where: { status: "BOOKED" } } } },
      },
      orderBy: { startsAt: "asc" },
    });
    res.json(
      schedules.map((s) => ({
        id: s.id,
        classId: s.classId,
        className: s.gymClass.name,
        type: s.gymClass.type,
        trainerName: s.gymClass.trainer?.user.name ?? null,
        startsAt: s.startsAt,
        endsAt: s.endsAt,
        capacity: s.gymClass.capacity,
        booked: s._count.bookings,
      }))
    );
  }
);

classesRouter.use(requireAuth);

classesRouter.post("/schedules/:scheduleId/book", async (req, res) => {
  const userId = req.userId!;
  const scheduleId = req.params.scheduleId;

  const schedule = await prisma.classSchedule.findUnique({
    where: { id: scheduleId },
    include: { gymClass: true, _count: { select: { bookings: { where: { status: "BOOKED" } } } } },
  });
  if (!schedule) throw ApiError.notFound("Class schedule not found");
  if (schedule._count.bookings >= schedule.gymClass.capacity) throw ApiError.conflict("Class is fully booked");

  const existing = await prisma.classBooking.findUnique({
    where: { scheduleId_userId: { scheduleId, userId } },
  });
  if (existing && existing.status === "BOOKED") throw ApiError.conflict("Already booked for this class");

  const booking = existing
    ? await prisma.classBooking.update({ where: { id: existing.id }, data: { status: "BOOKED" } })
    : await prisma.classBooking.create({ data: { scheduleId, userId, status: "BOOKED" } });

  res.status(201).json(booking);
});

classesRouter.post("/bookings/:bookingId/cancel", async (req, res) => {
  const booking = await prisma.classBooking.findFirst({
    where: { id: req.params.bookingId, userId: req.userId! },
  });
  if (!booking) throw ApiError.notFound("Booking not found");

  const updated = await prisma.classBooking.update({
    where: { id: booking.id },
    data: { status: "CANCELLED" },
  });
  res.json(updated);
});

classesRouter.get("/bookings/me", async (req, res) => {
  const bookings = await prisma.classBooking.findMany({
    where: { userId: req.userId! },
    include: { schedule: { include: { gymClass: true } } },
    orderBy: { schedule: { startsAt: "desc" } },
  });
  res.json(bookings);
});

export default classesRouter;
