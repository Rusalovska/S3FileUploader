
export interface AuthenticatedUser {
  kind: "user";
  userId: string;
  email: string;
  groupIds: string[];
}

export interface LinkActor {
  kind: "link";
  linkToken: string;
}

export interface AnonymousActor {
  kind: "anonymous";
}

export type Actor = AuthenticatedUser | LinkActor | AnonymousActor;

export const ANONYMOUS: AnonymousActor = { kind: "anonymous" };

export function isAuthenticated(actor: Actor): actor is AuthenticatedUser {
  return actor.kind === "user";
}