import { z } from "zod";

const paymentMethodSchema = z.enum(["UPI", "CREDIT_CARD", "DEBIT_CARD", "NET_BANKING"]);

export const createOrderSchema = z
  .object({
    type: z.enum(["PURCHASE", "RENEW", "UPGRADE"]),
    method: paymentMethodSchema,
    autoRenew: z.boolean().optional().default(false),
    planId: z.string().uuid().optional(),
    membershipId: z.string().uuid().optional(),
  })
  .refine((v) => v.type !== "PURCHASE" || !!v.planId, {
    message: "planId is required for a PURCHASE order",
    path: ["planId"],
  })
  .refine((v) => v.type === "PURCHASE" || !!v.membershipId, {
    message: "membershipId is required for RENEW/UPGRADE orders",
    path: ["membershipId"],
  })
  .refine((v) => v.type !== "UPGRADE" || !!v.planId, {
    message: "planId (the target plan) is required for an UPGRADE order",
    path: ["planId"],
  });

export const verifyPaymentSchema = z.object({
  paymentId: z.string().uuid(),
  razorpayOrderId: z.string().min(1),
  razorpayPaymentId: z.string().min(1),
  razorpaySignature: z.string().min(1),
});
