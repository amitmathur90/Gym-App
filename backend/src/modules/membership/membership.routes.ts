import { Router } from "express";
import { prisma } from "@/config/prisma";
import { razorpay } from "@/config/razorpay";
import { env } from "@/config/env";
import { requireAuth } from "@/middleware/auth";
import { validateBody } from "@/middleware/validate";
import { ApiError } from "@/utils/ApiError";
import { verifyRazorpaySignature } from "@/utils/razorpaySignature";
import { createOrderSchema, verifyPaymentSchema } from "./membership.schemas";
import { PaymentIntent } from "@prisma/client";
import { z } from "zod";

export const membershipRouter = Router();

// Public: browse available plans (no auth required).
membershipRouter.get("/plans", async (_req, res) => {
  const plans = await prisma.membershipPlan.findMany({ where: { isActive: true }, orderBy: { price: "asc" } });
  res.json(plans);
});

membershipRouter.use(requireAuth);

// Step 1 of the Razorpay flow: create a pending Payment + Razorpay order for
// a purchase/renew/upgrade. Nothing about the membership changes yet — that
// only happens once /verify confirms the payment signature.
membershipRouter.post("/order", validateBody(createOrderSchema), async (req, res) => {
  const userId = req.userId!;
  const { type, method, autoRenew, planId, membershipId } = req.body as z.infer<typeof createOrderSchema>;

  let amount: number;
  let pendingPlanId: string;
  let resolvedMembershipId: string | undefined;

  if (type === "PURCHASE") {
    const plan = await prisma.membershipPlan.findUnique({ where: { id: planId! } });
    if (!plan || !plan.isActive) throw ApiError.notFound("Membership plan not found");
    amount = Number(plan.price);
    pendingPlanId = plan.id;
  } else {
    const membership = await prisma.membership.findFirst({
      where: { id: membershipId!, userId },
      include: { plan: true },
    });
    if (!membership) throw ApiError.notFound("Membership not found");
    resolvedMembershipId = membership.id;

    if (type === "RENEW") {
      amount = Number(membership.plan.price);
      pendingPlanId = membership.planId;
    } else {
      const newPlan = await prisma.membershipPlan.findUnique({ where: { id: planId! } });
      if (!newPlan || !newPlan.isActive) throw ApiError.notFound("Target plan not found");
      amount = Number(newPlan.price);
      pendingPlanId = newPlan.id;
    }
  }

  const amountPaise = Math.round(amount * 100);

  const payment = await prisma.payment.create({
    data: {
      userId,
      membershipId: resolvedMembershipId,
      amount,
      method,
      status: "PENDING",
      intentType: type as PaymentIntent,
      pendingPlanId,
    },
  });

  const order = await razorpay.orders.create({
    amount: amountPaise,
    currency: "INR",
    receipt: payment.id,
    notes: { paymentId: payment.id, type, userId },
  });

  await prisma.payment.update({ where: { id: payment.id }, data: { razorpayOrderId: order.id } });

  res.status(201).json({
    paymentId: payment.id,
    orderId: order.id,
    amount: amountPaise,
    currency: "INR",
    keyId: env.razorpayKeyId,
    autoRenew,
  });
});

// Step 2: verify the Razorpay signature and apply the now-confirmed payment
// to the membership (create it for PURCHASE, extend it for RENEW, or swap
// plans for UPGRADE).
membershipRouter.post("/verify", validateBody(verifyPaymentSchema), async (req, res) => {
  const userId = req.userId!;
  const { paymentId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body as z.infer<
    typeof verifyPaymentSchema
  >;

  const payment = await prisma.payment.findFirst({ where: { id: paymentId, userId } });
  if (!payment) throw ApiError.notFound("Payment not found");
  if (payment.status !== "PENDING") throw ApiError.conflict("Payment has already been processed");
  if (payment.razorpayOrderId !== razorpayOrderId) throw ApiError.badRequest("Order mismatch");

  const isValid = verifyRazorpaySignature({
    orderId: razorpayOrderId,
    paymentId: razorpayPaymentId,
    signature: razorpaySignature,
  });

  if (!isValid) {
    await prisma.payment.update({ where: { id: payment.id }, data: { status: "FAILED", razorpayPaymentId } });
    throw ApiError.badRequest("Payment signature verification failed");
  }

  const plan = await prisma.membershipPlan.findUnique({ where: { id: payment.pendingPlanId! } });
  if (!plan) throw ApiError.notFound("Plan for this payment no longer exists");

  const now = new Date();
  let membership;

  if (payment.intentType === PaymentIntent.PURCHASE) {
    membership = await prisma.membership.create({
      data: {
        userId,
        planId: plan.id,
        status: "ACTIVE",
        startDate: now,
        endDate: new Date(now.getTime() + plan.durationDays * 86_400_000),
        autoRenew: false,
      },
    });
  } else {
    const existing = await prisma.membership.findUnique({ where: { id: payment.membershipId! } });
    if (!existing) throw ApiError.notFound("Membership not found");

    const baseDate = payment.intentType === PaymentIntent.RENEW && existing.status === "ACTIVE" ? existing.endDate : now;
    membership = await prisma.membership.update({
      where: { id: existing.id },
      data: {
        planId: plan.id,
        status: "ACTIVE",
        endDate: new Date(baseDate.getTime() + plan.durationDays * 86_400_000),
      },
    });
  }

  await prisma.payment.update({
    where: { id: payment.id },
    data: { status: "SUCCESS", razorpayPaymentId, membershipId: membership.id },
  });

  res.json({ membership });
});

membershipRouter.get("/history", async (req, res) => {
  const memberships = await prisma.membership.findMany({
    where: { userId: req.userId! },
    include: { plan: true, payments: true },
    orderBy: { createdAt: "desc" },
  });
  res.json(memberships);
});

membershipRouter.get("/card", async (req, res) => {
  const membership = await prisma.membership.findFirst({
    where: { userId: req.userId!, status: "ACTIVE" },
    include: { plan: true, user: { select: { name: true, email: true, avatarUrl: true } } },
    orderBy: { endDate: "desc" },
  });
  if (!membership) throw ApiError.notFound("No active membership found");
  res.json({
    cardCode: membership.cardCode,
    memberName: membership.user.name,
    planName: membership.plan.name,
    validUntil: membership.endDate,
  });
});

export default membershipRouter;
