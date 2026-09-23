import type { DenyReason } from "./authorization";

export class AuthenticationRequiredError extends Error {
  readonly statusCode = 401;
  constructor(message = "Authentication required") {
    super(message);
    this.name = "AuthenticationRequiredError";
  }
}

export class ForbiddenError extends Error {
  readonly statusCode = 403;
  constructor(public readonly reason: DenyReason, message = "Access denied") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export class ResourceNotFoundError extends Error {
  readonly statusCode = 404;
  constructor(message = "Resource not found") {
    super(message);
    this.name = "ResourceNotFoundError";
  }
}