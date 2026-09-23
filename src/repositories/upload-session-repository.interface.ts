import type { UploadSessionEntity, CreateUploadSessionInput } from "../domain/upload-session";

export interface UploadSessionRepository {
  create(input: CreateUploadSessionInput): Promise<UploadSessionEntity>;
  findByFileId(fileId: string): Promise<UploadSessionEntity | null>;
  markCompleted(id: string): Promise<UploadSessionEntity>;
  findExpiredIncomplete(before: Date): Promise<UploadSessionEntity[]>;
}