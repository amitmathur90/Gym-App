import crypto from "node:crypto";
import { env } from "@/config/env";

/// Verifies the HMAC SHA256 signature Razorpay's client SDK returns after a
/// successful checkout, per https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/build-integration/#step-5-verify-payment-signature
export function verifyRazorpaySignature(params: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  const expected = crypto
    .createHmac("sha256", env.razorpayKeySecret)
    .update(`${params.orderId}|${params.paymentId}`)
    .digest("hex");

  const expectedBuf = Buffer.from(expected, "hex");
  const actualBuf = Buffer.from(params.signature, "hex");
  if (expectedBuf.length !== actualBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, actualBuf);
}
