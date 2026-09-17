export type UploadMethod = "PUT" | "POST";

export interface UploadSessionEntity {
  id: string;
  fileId: string;
  presignedUrl: string;
  method: UploadMethod;
  expiresAt: Date;
  completedAt: Date | null;
  createdAt: Date;
}

export interface CreateUploadSessionInput {
  fileId: string;
  presignedUrl: string;
  method: UploadMethod;
  expiresAt: Date;
}