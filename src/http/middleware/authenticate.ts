import type { Request, Response, NextFunction } from "express";
import type { TokenService } from "../../services/token.service.interface";
import { type Actor, ANONYMOUS } from "../../domain/actor";

declare global {
  namespace Express {
    interface Request {
      actor: Actor;
    }
  }
}

export function authenticate(tokens: TokenService) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const linkToken = req.query.share_token;
    if (typeof linkToken === "string" && linkToken.length > 0) {
      req.actor = { kind: "link", linkToken };
      return next();
    }

    const header = req.headers.authorization;
    if (header?.startsWith("Bearer ")) {
      const user = tokens.verify(header.slice("Bearer ".length));
      req.actor = user ?? ANONYMOUS;
      return next();
    }

    req.actor = ANONYMOUS;
    next();
  };
}