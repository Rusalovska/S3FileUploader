import jwt, { type JwtPayload } from "jsonwebtoken";
import type { TokenService, TokenPayload } from "./token.service.interface";
import type { AuthenticatedUser } from "../domain/actor";

export interface JwtConfig {
  secret: string;
  expiresIn: string;
}

export class JwtTokenService implements TokenService {
  constructor(private readonly config: JwtConfig) {}

  sign(payload: TokenPayload): string {
    return jwt.sign(payload, this.config.secret, {
      expiresIn: this.config.expiresIn,
    } as jwt.SignOptions);
  }

  verify(token: string): AuthenticatedUser | null {
    try {
      const decoded = jwt.verify(token, this.config.secret) as JwtPayload & Partial<TokenPayload>;

      if (typeof decoded.userId !== "string" || typeof decoded.email !== "string") {
        return null;
      }

      return {
        kind: "user",
        userId: decoded.userId,
        email: decoded.email,
        groupIds: Array.isArray(decoded.groupIds) ? decoded.groupIds : [],
      };
    } catch {
      // Expired, malformed, or bad signature — all indistinguishable to the caller.
      return null;
    }
  }
}