import { randomUUID } from "node:crypto";
import path from "node:path";

function sanitizeFilename(filename: string): string {
  const base = path.basename(filename);
  return base.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 200);
}

export const StorageKey = {
  forOriginal(ownerId: string, filename: string): string {
    return `users/${ownerId}/files/${randomUUID()}/${sanitizeFilename(filename)}`;
  },

  forThumbnail(fileId: string, size: number): string {
    return `thumbnails/${fileId}/${size}.webp`;
  },

  thumbnailPrefix(fileId: string): string {
    return `thumbnails/${fileId}/`;
  },
} as const;