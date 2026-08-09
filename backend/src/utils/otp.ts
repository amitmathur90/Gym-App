export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export const OTP_TTL_MINUTES = 10;
