import { Router } from "express";
import { z } from "zod";
import { prisma } from "@/config/prisma";
import { requireAuth } from "@/middleware/auth";
import { validateBody } from "@/middleware/validate";
import { ApiError } from "@/utils/ApiError";

export const trainersRouter = Router();

trainersRouter.get("/", async (_req, res) => {
  const trainers = await prisma.trainer.findMany({
    include: { user: { select: { name: true, avatarUrl: true } }, availability: true },
  });
  res.json(trainers);
});

trainersRouter.get("/:id", async (req, res) => {
  const trainer = await prisma.trainer.findUnique({
    where: { id: req.params.id },
    include: { user: { select: { name: true, avatarUrl: true } }, availability: true },
  });
  if (!trainer) throw ApiError.notFound("Trainer not found");
  res.json(trainer);
});

trainersRouter.use(requireAuth);

const bookTrainerSchema = z.object({
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  sessionType: z.string().max(80).optional(),
});

trainersRouter.post("/:id/book", validateBody(bookTrainerSchema), async (req, res) => {
  const trainer = await prisma.trainer.findUnique({ where: { id: req.params.id } });
  if (!trainer) throw ApiError.notFound("Trainer not found");

  const { startTime, endTime } = req.body as { startTime: string; endTime: string };
  const start = new Date(startTime);
  const end = new Date(endTime);
  if (end <= start) throw ApiError.badRequest("endTime must be after startTime");

  const conflict = await prisma.personalTrainerBooking.findFirst({
    where: {
      trainerId: trainer.id,
      status: { in: ["UPCOMING", "IN_PROGRESS"] },
      startTime: { lt: end },
      endTime: { gt: start },
    },
  });
  if (conflict) throw ApiError.conflict("Trainer is not available at this time");

  const booking = await prisma.personalTrainerBooking.create({
    data: {
      trainerId: trainer.id,
      userId: req.userId!,
      startTime: start,
      endTime: end,
      sessionType: (req.body as { sessionType?: string }).sessionType,
    },
  });
  res.status(201).json(booking);
});

trainersRouter.get("/bookings/me", async (req, res) => {
  const bookings = await prisma.personalTrainerBooking.findMany({
    where: { userId: req.userId! },
    include: { trainer: { include: { user: { select: { name: true } } } } },
    orderBy: { startTime: "desc" },
  });
  res.json(bookings);
});

trainersRouter.patch("/bookings/:id/cancel", async (req, res) => {
  const booking = await prisma.personalTrainerBooking.findFirst({
    where: { id: req.params.id, userId: req.userId! },
  });
  if (!booking) throw ApiError.notFound("Booking not found");
  if (booking.status === "CANCELLED" || booking.status === "COMPLETED") {
    throw ApiError.badRequest(`This booking is already ${booking.status.toLowerCase()}`);
  }

  const updated = await prisma.personalTrainerBooking.update({
    where: { id: booking.id },
    data: { status: "CANCELLED" },
  });
  res.json(updated);
});

// ------------------------------------------------------------------
// A member's chat with their assigned trainer. Unlike the booking
// routes above (which work with any trainer), messaging is scoped to
// the trainer the member has actually been assigned to, mirroring how
// trainer.routes.ts's messaging is scoped to a trainer's own members.
// ------------------------------------------------------------------

async function resolveAssignedTrainerUserId(memberId: string): Promise<string> {
  const member = await prisma.user.findUnique({
    where: { id: memberId },
    select: { assignedTrainerId: true },
  });
  if (!member?.assignedTrainerId) {
    throw ApiError.badRequest("You don't have an assigned trainer yet.");
  }
  const trainer = await prisma.trainer.findUnique({
    where: { id: member.assignedTrainerId },
    select: { userId: true },
  });
  if (!trainer) throw ApiError.notFound("Trainer not found");
  return trainer.userId;
}

trainersRouter.get("/me/messages", async (req, res) => {
  const trainerUserId = await resolveAssignedTrainerUserId(req.userId!);

  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: req.userId!, receiverId: trainerUserId },
        { senderId: trainerUserId, receiverId: req.userId! },
      ],
    },
    orderBy: { createdAt: "asc" },
  });

  await prisma.message.updateMany({
    where: { senderId: trainerUserId, receiverId: req.userId!, readAt: null },
    data: { readAt: new Date() },
  });

  res.json(messages);
});

const sendMemberMessageSchema = z.object({
  body: z.string().max(4000).optional(),
  attachmentUrl: z.string().url().optional(),
  attachmentType: z.enum(["IMAGE", "DOCUMENT"]).optional(),
});

trainersRouter.post("/me/messages", validateBody(sendMemberMessageSchema), async (req, res) => {
  const trainerUserId = await resolveAssignedTrainerUserId(req.userId!);

  const message = await prisma.message.create({
    data: { senderId: req.userId!, receiverId: trainerUserId, ...(req.body as z.infer<typeof sendMemberMessageSchema>) },
  });
  res.status(201).json(message);
});

export default trainersRouter;
