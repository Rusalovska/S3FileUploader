import rateLimit from "express-rate-limit";
import type { Request } from "express";

export const uploadRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request): string => {
    return req.actor?.kind === "user" ? `user:${req.actor.userId}` : `ip:${req.ip}`;
  },
  message: { error: "Too many upload requests, please try again later" },
});