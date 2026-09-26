import type { Request, Response, NextFunction } from "express";
import type { ZodSchema } from "zod";
import { BadRequestError } from "../../domain/authorization.errors";

interface ValidationTargets {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

declare global {
  namespace Express {
    interface Request {
      validated: {
        body?: unknown;
        query?: unknown;
        params?: unknown;
      };
    }
  }
}

export function validate(targets: ValidationTargets) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    req.validated = {};

    for (const [key, schema] of Object.entries(targets) as Array<[keyof ValidationTargets, ZodSchema]>) {
      const result = schema.safeParse(req[key]);
      if (!result.success) {
        const issues = result.error.issues
          .map((i) => `${i.path.join(".") || key}: ${i.message}`)
          .join("; ");
        next(new BadRequestError(`Validation failed — ${issues}`));
        return;
      }
      req.validated[key] = result.data;
    }

    next();
  };
}