import type { FolderRepository } from "../repositories/folder-repository.interface";
import type { AuthenticatedUser } from "../domain/actor";
import type { FolderEntity } from "../domain/folder";
import { BadRequestError } from "../domain/authorization.errors";
import { ResourceNotFoundError, ForbiddenError } from "../domain/authorization.errors";

export class FolderService {
  constructor(private readonly folders: FolderRepository) {}

  async createFolder(
    actor: AuthenticatedUser,
    name: string,
    parentId: string | null
  ): Promise<FolderEntity> {
    if (parentId) {
      const parent = await this.assertOwned(actor, parentId);
      void parent; // existence + ownership already verified
    }
    return this.folders.create({ ownerId: actor.userId, parentId, name });
  }

  async getFolder(actor: AuthenticatedUser, folderId: string): Promise<FolderEntity> {
    return this.assertOwned(actor, folderId);
  }

  async listChildren(actor: AuthenticatedUser, parentId: string | null): Promise<FolderEntity[]> {
    if (parentId) await this.assertOwned(actor, parentId);
    return this.folders.findChildren(parentId, actor.userId);
  }

  async renameFolder(actor: AuthenticatedUser, folderId: string, name: string): Promise<FolderEntity> {
    await this.assertOwned(actor, folderId);
    return this.folders.rename(folderId, name);
  }

  async moveFolder(
    actor: AuthenticatedUser,
    folderId: string,
    newParentId: string | null
  ): Promise<FolderEntity> {
    await this.assertOwned(actor, folderId);
    if (newParentId) {
      const target = await this.assertOwned(actor, newParentId);
      if (target.path.startsWith((await this.folders.findById(folderId))!.path)) {
        throw new BadRequestError("Cannot move a folder into its own descendant");
      }
    }
    return this.folders.move(folderId, newParentId);
  }

  async deleteFolder(actor: AuthenticatedUser, folderId: string): Promise<void> {
    await this.assertOwned(actor, folderId);
    await this.folders.delete(folderId);
  }

  private async assertOwned(actor: AuthenticatedUser, folderId: string): Promise<FolderEntity> {
    const folder = await this.folders.findById(folderId);
    if (!folder) throw new ResourceNotFoundError("Folder not found");
    if (folder.ownerId !== actor.userId) throw new ForbiddenError("NOT_OWNER", "Not your folder");
    return folder;
  }
}