
export class StorageError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = "StorageError";
  }
}

export class ObjectNotFoundError extends StorageError {
  constructor(public readonly key: string, cause?: unknown) {
    super(`Object not found: ${key}`, cause);
    this.name = "ObjectNotFoundError";
  }
}

export class StorageAccessDeniedError extends StorageError {
  constructor(public readonly key: string, cause?: unknown) {
    super(`Access denied for object: ${key}`, cause);
    this.name = "StorageAccessDeniedError";
  }
}

export class StorageUnavailableError extends StorageError {
  constructor(cause?: unknown) {
    super("Storage backend is unavailable", cause);
    this.name = "StorageUnavailableError";
  }
}