import type { FileRepository, FileListFilters } from "../repositories/file-repository.interface";
import type { FolderRepository } from "../repositories/folder-repository.interface";
import type { FileAccessGuard } from "./file-access.guard";
import type { Actor, AuthenticatedUser } from "../domain/actor";
import type { FileEntity, Visibility } from "../domain/file";
import { BadRequestError } from "../domain/authorization.errors";

export interface UpdateFileInput {
  folderId?: string | null;
  visibility?: Visibility;
}

export class FileService {
  constructor(
    private readonly files: FileRepository,
    private readonly folders: FolderRepository,
    private readonly guard: FileAccessGuard
  ) {}

  async getFile(actor: Actor, fileId: string): Promise<FileEntity> {
    return this.guard.require(actor, fileId, "file:read");
  }

  async listFiles(actor: AuthenticatedUser, filters: Omit<FileListFilters, "ownerId">) {
    // Listing is always scoped to the caller's own files — sharing is discovered
    // via individual file access, not by browsing someone else's folder tree.
    return this.files.list({ ...filters, ownerId: actor.userId });
  }

  async updateFile(actor: Actor, fileId: string, input: UpdateFileInput): Promise<FileEntity> {
    const file = await this.guard.require(actor, fileId, "file:write");

    if (input.folderId !== undefined && input.folderId !== null) {
      const folder = await this.folders.findById(input.folderId);
      if (!folder || folder.ownerId !== file.ownerId) {
        throw new BadRequestError("Invalid folder_id");
      }
    }

    return this.files.update(fileId, input);
  }

  async deleteFile(actor: Actor, fileId: string): Promise<void> {
    await this.guard.require(actor, fileId, "file:delete");
    await this.files.softDelete(fileId);
  }
}