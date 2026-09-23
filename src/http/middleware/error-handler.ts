import type { Request, Response, NextFunction } from "express";

interface HttpishError extends Error {
  statusCode?: number;
}

export function errorHandler(
  err: HttpishError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const status = err.statusCode ?? 500;

  if (status >= 500) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
    return;
  }

  res.status(status).json({ error: err.message });
}