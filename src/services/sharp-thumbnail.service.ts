import sharp from "sharp";
import type { ThumbnailService, ThumbnailSpec, GeneratedThumbnail } from "../domain/thumbnail";
import { StorageKey } from "../storage/storage-key";

const SUPPORTED_PREFIXES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];

export class SharpThumbnailService implements ThumbnailService {
  supports(mimeType: string): boolean {
    return SUPPORTED_PREFIXES.includes(mimeType.toLowerCase());
  }

  async generate(
    fileId: string,
    sourceBuffer: Buffer,
    specs: ThumbnailSpec[]
  ): Promise<GeneratedThumbnail[]> {
    const results: GeneratedThumbnail[] = [];

    for (const spec of specs) {
      const buffer = await sharp(sourceBuffer)
        .rotate()
        .resize(spec.size, spec.size, { fit: "inside", withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();

      results.push({
        size: spec.size,
        key: StorageKey.forThumbnail(fileId, spec.size),
        contentType: "image/webp",
        buffer,
      });
    }

    return results;
  }
}