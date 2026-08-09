import { Router } from "express";
import { prisma } from "@/config/prisma";
import { requireAuth } from "@/middleware/auth";
import { ApiError } from "@/utils/ApiError";

export const paymentsRouter = Router();
paymentsRouter.use(requireAuth);

paymentsRouter.get("/", async (req, res) => {
  const payments = await prisma.payment.findMany({
    where: { userId: req.userId! },
    include: { membership: { include: { plan: true } } },
    orderBy: { createdAt: "desc" },
  });
  res.json(payments);
});

// Returns a simple JSON invoice payload; swap for a generated PDF (e.g. via
// pdfkit) once invoice formatting requirements are defined.
paymentsRouter.get("/:id/invoice", async (req, res) => {
  const payment = await prisma.payment.findFirst({
    where: { id: req.params.id, userId: req.userId! },
    include: { membership: { include: { plan: true } }, user: { select: { name: true, email: true } } },
  });
  if (!payment) throw ApiError.notFound("Payment not found");

  res.json({
    invoiceNumber: payment.invoiceNumber,
    issuedTo: payment.user.name,
    email: payment.user.email,
    plan: payment.membership?.plan.name ?? null,
    amount: payment.amount,
    method: payment.method,
    status: payment.status,
    date: payment.createdAt,
  });
});

export default paymentsRouter;
