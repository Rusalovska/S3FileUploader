export type FileStatus = "PENDING" | "UPLOADED" | "FAILED";
export type Visibility = "PUBLIC" | "PRIVATE" | "SHARED";
export type ThumbnailStatus = "NOT_APPLICABLE" | "PENDING" | "PROCESSING" | "READY" | "FAILED";

export interface FileEntity {
  id: string;
  ownerId: string;
  folderId: string | null;
  key: string;
  originalName: string;
  mimeType: string;
  sizeBytes: bigint;
  checksum: string | null;
  status: FileStatus;
  visibility: Visibility;
  thumbnailKey: string | null;
  thumbnailStatus: ThumbnailStatus;
  deletedAt: Date | null;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateFileInput {
  ownerId: string;
  folderId?: string | null;
  key: string;
  originalName: string;
  mimeType: string;
  sizeBytes: bigint;
  visibility?: Visibility;
  expiresAt?: Date | null;
}

export interface UpdateFileInput {
  folderId?: string | null;
  visibility?: Visibility;
  status?: FileStatus;
  checksum?: string | null;
  thumbnailKey?: string | null;
  thumbnailStatus?: ThumbnailStatus;
}