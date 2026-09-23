import type { FileEntity } from "../domain/file";
import type { FileRepository } from "../repositories/file-repository.interface";
import type { PermissionService } from "./permission.service";
import type { Actor } from "../domain/actor";
import type { FileAction, AuthorizationResult } from "../domain/authorization";
import { toHttpError } from "../domain/authorization.http";
import { ResourceNotFoundError } from "../domain/authorization.errors";

export class FileAccessGuard {
  constructor(
    private readonly files: FileRepository,
    private readonly permissions: PermissionService
  ) {}

  async check(
    actor: Actor,
    fileId: string,
    action: FileAction
  ): Promise<{ file: FileEntity | null; result: AuthorizationResult }> {
    const file = await this.files.findById(fileId, { includeDeleted: true });

    if (!file) {
      return { file: null, result: { allowed: false, reason: "NOT_FOUND" } };
    }

    const result = await this.permissions.canAccessFile(actor, file, action);
    return { file, result };
  }

  async require(actor: Actor, fileId: string, action: FileAction): Promise<FileEntity> {
    const { file, result } = await this.check(actor, fileId, action);

    if (!file) throw new ResourceNotFoundError();
    if (!result.allowed) throw toHttpError(result.reason);

    return file;
  }
}