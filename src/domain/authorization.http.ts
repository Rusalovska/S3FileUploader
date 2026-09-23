import type { DenyReason } from "./authorization";
import { AuthenticationRequiredError, ResourceNotFoundError, ForbiddenError } from "./authorization.errors";

export function toHttpError(reason: DenyReason): Error {
  switch (reason) {
    case "NOT_AUTHENTICATED":
      return new AuthenticationRequiredError();

    case "NOT_FOUND":
    case "NOT_OWNER":
    case "NO_GRANT":
    case "FILE_DELETED":
      return new ResourceNotFoundError();

    case "GRANT_EXPIRED":
      return new ForbiddenError(reason, "This share link has expired");
    case "INSUFFICIENT_LEVEL":
      return new ForbiddenError(reason, "Insufficient permission level");
  }
}