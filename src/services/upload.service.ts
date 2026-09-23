import type { FileRepository } from "../repositories/file-repository.interface";
import type { UploadSessionRepository } from "../repositories/upload-session-repository.interface";
import type { FolderRepository } from "../repositories/folder-repository.interface";
import type { StorageProvider } from "../domain/storage";
import type { AuthenticatedUser } from "../domain/actor";
import type { FileEntity, Visibility } from "../domain/file";
import { StorageKey } from "../storage/storage-key";
import { BadRequestError } from "../domain/authorization.errors";

export interface RequestUploadInput {
  filename: string;
  contentType: string;
  sizeBytes: number;
  folderId?: string | null;
  visibility?: Visibility;
}

export interface RequestUploadResult {
  fileId: string;
  uploadUrl: string;
  method: "PUT" | "POST";
  headers: Record<string, string>;
  expiresAt: Date;
}

const MAX_UPLOAD_BYTES = 2 * 1024 * 1024 * 1024;

export class UploadService {
  constructor(
    private readonly files: FileRepository,
    private readonly folders: FolderRepository,
    private readonly uploadSessions: UploadSessionRepository,
    private readonly storage: StorageProvider
  ) {}

  async requestUpload(
    actor: AuthenticatedUser,
    input: RequestUploadInput
  ): Promise<RequestUploadResult> {
    if (input.sizeBytes <= 0 || input.sizeBytes > MAX_UPLOAD_BYTES) {
      throw new BadRequestError(`File size must be between 1 byte and ${MAX_UPLOAD_BYTES} bytes`);
    }

    if (input.folderId) {
      const folder = await this.folders.findById(input.folderId);
      if (!folder || folder.ownerId !== actor.userId) {
        throw new BadRequestError("Invalid folder_id");
      }
    }

    const key = StorageKey.forOriginal(actor.userId, input.filename);

    const file = await this.files.create({
      ownerId: actor.userId,
      folderId: input.folderId ?? null,
      key,
      originalName: input.filename,
      mimeType: input.contentType,
      sizeBytes: BigInt(input.sizeBytes),
      visibility: input.visibility ?? "PRIVATE",
    });

    const presigned = await this.storage.generateUploadUrl({
      key,
      contentType: input.contentType,
      contentLength: input.sizeBytes,
    });

    await this.uploadSessions.create({
      fileId: file.id,
      presignedUrl: presigned.url,
      method: presigned.method,
      expiresAt: presigned.expiresAt,
    });

    return {
      fileId: file.id,
      uploadUrl: presigned.url,
      method: presigned.method,
      headers: presigned.headers,
      expiresAt: presigned.expiresAt,
    };
  }

  async completeUpload(actor: AuthenticatedUser, fileId: string): Promise<FileEntity> {
    const file = await this.files.findById(fileId, { includeDeleted: true });
    if (!file || file.ownerId !== actor.userId) {
      throw new BadRequestError("File not found or not owned by caller");
    }
    if (file.status === "UPLOADED") {
      return file; // idempotent — already completed
    }

    const session = await this.uploadSessions.findByFileId(fileId);
    if (!session) {
      throw new BadRequestError("No upload session found for this file");
    }
    if (session.expiresAt.getTime() < Date.now()) {
      await this.files.update(fileId, { status: "FAILED" });
      throw new BadRequestError("Upload URL expired before the file was uploaded");
    }

    const objectMeta = await this.storage.headObject(file.key);
    if (!objectMeta) {
      throw new BadRequestError("Object not found in storage — upload did not complete");
    }

    if (objectMeta.sizeBytes !== file.sizeBytes) {
      await this.files.update(fileId, { status: "FAILED" });
      throw new BadRequestError(
        `Uploaded size (${objectMeta.sizeBytes}) does not match expected size (${file.sizeBytes})`
      );
    }

    const updated = await this.files.update(fileId, {
      status: "UPLOADED",
      checksum: objectMeta.etag,
    });

    await this.uploadSessions.markCompleted(session.id);
    return updated;
  }
}