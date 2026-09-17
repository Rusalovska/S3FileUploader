import type { FolderEntity, CreateFolderInput } from "../domain/folder";

export interface FolderRepository {
  create(input: CreateFolderInput): Promise<FolderEntity>;
  findById(id: string): Promise<FolderEntity | null>;
  findChildren(parentId: string | null, ownerId: string): Promise<FolderEntity[]>;
  findSubtree(path: string): Promise<FolderEntity[]>; 
  rename(id: string, name: string): Promise<FolderEntity>;
  move(id: string, newParentId: string | null): Promise<FolderEntity>; 
  delete(id: string): Promise<void>;
}