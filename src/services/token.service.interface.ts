import type { AuthenticatedUser } from "../domain/actor";

export interface TokenPayload {
  userId: string;
  email: string;
  groupIds: string[];
}

export interface TokenService {
  sign(payload: TokenPayload): string;
  verify(token: string): AuthenticatedUser | null;
}