import type { FileAccessGuard } from "./file-access.guard";
import type { StorageProvider } from "../domain/storage";
import type { Actor } from "../domain/actor";
import { BadRequestError } from "../domain/authorization.errors";

export class DownloadService {
  constructor(
    private readonly guard: FileAccessGuard,
    private readonly storage: StorageProvider
  ) {}

  async getDownloadUrl(actor: Actor, fileId: string): Promise<string> {
    const file = await this.guard.require(actor, fileId, "file:download");

    if (file.status !== "UPLOADED") {
      throw new BadRequestError("File upload is not yet complete");
    }

    return this.storage.generateDownloadUrl(file.key, {
      downloadFilename: file.originalName,
      responseContentType: file.mimeType,
    });
  }
}