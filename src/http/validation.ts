import { BadRequestError } from "../domain/authorization.errors";

export function requireParam(
  params: Record<string, string | string[] | undefined>,
  name: string
): string {
  const val = params[name];
  if (typeof val !== "string" || val.trim().length === 0) {
    throw new BadRequestError(`Missing or invalid route parameter: ${name}`);
  }
  return val;
}

export function requireString(body: unknown, field: string): string {
  const val = (body as Record<string, unknown>)?.[field];
  if (typeof val !== "string" || val.trim().length === 0) {
    throw new BadRequestError(`Field "${field}" is required and must be a non-empty string`);
  }
  return val;
}

export function optionalString(body: unknown, field: string): string | undefined {
  const val = (body as Record<string, unknown>)?.[field];
  if (val === undefined || val === null) return undefined;
  if (typeof val !== "string") {
    throw new BadRequestError(`Field "${field}" must be a string`);
  }
  return val;
}

export function optionalEnum<T extends string>(
  body: unknown,
  field: string,
  allowed: readonly T[]
): T | undefined {
  const val = (body as Record<string, unknown>)?.[field];
  if (val === undefined || val === null) return undefined;
  if (typeof val !== "string" || !allowed.includes(val as T)) {
    throw new BadRequestError(`Field "${field}" must be one of: ${allowed.join(", ")}`);
  }
  return val as T;
}

export function requirePositiveInt(body: unknown, field: string): number {
  const val = (body as Record<string, unknown>)?.[field];
  if (typeof val !== "number" || !Number.isInteger(val) || val <= 0) {
    throw new BadRequestError(`Field "${field}" must be a positive integer`);
  }
  return val;
}