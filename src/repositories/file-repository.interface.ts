import type { FileEntity, CreateFileInput, UpdateFileInput } from "../domain/file";

export interface FileListFilters {
  ownerId: string;
  folderId?: string | null;
  visibility?: FileEntity["visibility"];
  includeDeleted?: boolean;
  cursor?: string;
  limit?: number;
}

export interface FileRepository {
  create(input: CreateFileInput): Promise<FileEntity>;
  findById(id: string, opts?: { includeDeleted?: boolean }): Promise<FileEntity | null>;
  findByKey(key: string): Promise<FileEntity | null>;
  list(filters: FileListFilters): Promise<{ items: FileEntity[]; nextCursor: string | null }>;
  update(id: string, input: UpdateFileInput): Promise<FileEntity>;
  softDelete(id: string): Promise<void>;
  hardDelete(id: string): Promise<void>;

  findExpiredPendingUploads(before: Date): Promise<FileEntity[]>;
  findSoftDeletedPast(cutoff: Date): Promise<FileEntity[]>;
}