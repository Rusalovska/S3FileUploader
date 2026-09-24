import type { FileRepository } from "../repositories/file-repository.interface";
import type { StorageProvider } from "../domain/storage";
import type { ThumbnailService } from "../domain/thumbnail";
import type { FileUploadedEvent } from "../events/event-bus";
import { THUMBNAIL_SIZES, MAX_THUMBNAIL_ATTEMPTS, RETRY_BASE_DELAY_MS } from "../domain/thumbnail-job";
import { ObjectNotFoundError } from "../storage/storage.errors";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

export class ThumbnailWorker {
  constructor(
    private readonly files: FileRepository,
    private readonly storage: StorageProvider,
    private readonly thumbnails: ThumbnailService
  ) {}

  async handle(event: FileUploadedEvent): Promise<void> {
    if (!this.thumbnails.supports(event.mimeType)) {
      await this.files.update(event.fileId, { thumbnailStatus: "NOT_APPLICABLE" });
      return;
    }

    await this.processWithRetry(event.fileId, event.key);
  }

  private async processWithRetry(fileId: string, key: string): Promise<void> {
    const current = await this.files.findById(fileId, { includeDeleted: true });
    if (!current) { throw new ObjectNotFoundError(`File record ${fileId} not found`); }
    if (current.thumbnailStatus === "READY") return;

    await this.files.update(fileId, { thumbnailStatus: "PROCESSING" });

    let lastError: unknown;

    for (let attempt = 1; attempt <= MAX_THUMBNAIL_ATTEMPTS; attempt++) {
      try {
        await this.generateAndStore(fileId, key);
        await this.files.update(fileId, { thumbnailStatus: "READY" });
        return;
      } catch (err) {
        lastError = err;

        if (err instanceof ObjectNotFoundError) break;

        if (attempt < MAX_THUMBNAIL_ATTEMPTS) {
          await sleep(RETRY_BASE_DELAY_MS * 2 ** (attempt - 1)); // 2s, 4s, ...
        }
      }
    }

    console.error(`Thumbnail generation failed for file ${fileId} after retries:`, lastError);
    await this.files.update(fileId, { thumbnailStatus: "FAILED" });
  }

  private async generateAndStore(fileId: string, key: string): Promise<void> {
    const stream = await this.storage.getObjectStream(key);
    const buffer = await streamToBuffer(stream);

    const specs = THUMBNAIL_SIZES.map((size) => ({ size, format: "webp" as const }));
    const thumbnails = await this.thumbnails.generate(fileId, buffer, specs);
    const largest = thumbnails.reduce((a, b) => (a.size > b.size ? a : b));

    for (const thumb of thumbnails) {
      await this.storage.putObject(thumb.key, thumb.buffer, {
        contentType: thumb.contentType,
        cacheControl: "public, max-age=31536000, immutable",
      });
    }

    await this.files.update(fileId, { thumbnailKey: largest.key });
  }
}