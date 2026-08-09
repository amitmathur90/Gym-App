import { RequestHandler } from "express";
import { ApiError } from "@/utils/ApiError";
import { verifyAccessToken } from "@/utils/jwt";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId?: string;
      userRole?: string;
    }
  }
}

export const requireAuth: RequestHandler = (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    throw ApiError.unauthorized("Missing bearer token");
  }
  const token = header.slice("Bearer ".length);
  try {
    const payload = verifyAccessToken(token);
    req.userId = payload.sub;
    req.userRole = payload.role;
    next();
  } catch {
    throw ApiError.unauthorized("Invalid or expired token");
  }
};

export function requireRole(...roles: string[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.userRole || !roles.includes(req.userRole)) {
      throw ApiError.forbidden("Insufficient permissions");
    }
    next();
  };
}
