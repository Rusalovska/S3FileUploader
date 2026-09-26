import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

interface HttpishError extends Error {
  statusCode?: number;
}

export function errorHandler(
  err: HttpishError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const status = err.statusCode ?? (err instanceof ZodError ? 400 : 500);

  if (status >= 500) {
    console.error("Unhandled error:", err);
    res.status(500).json({ error: "Internal server error" });
    return;
  }

  res.status(status).json({ error: err.message });
}