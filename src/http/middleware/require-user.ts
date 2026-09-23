import type { Request, Response, NextFunction } from "express";
import { AuthenticationRequiredError } from "../../domain/authorization.errors";

export function requireUser(req: Request, _res: Response, next: NextFunction): void {
  if (req.actor.kind !== "user") {
    return next(new AuthenticationRequiredError());
  }
  next();
}