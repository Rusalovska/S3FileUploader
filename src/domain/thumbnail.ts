export interface ThumbnailSpec {
  size: number;
  format: "webp";
}

export interface GeneratedThumbnail {
  size: number;
  key: string;
  contentType: string;
  buffer: Buffer;
}

export interface ThumbnailService {
  supports(mimeType: string): boolean;

  generate(
    fileId: string,
    sourceBuffer: Buffer,
    specs: ThumbnailSpec[]
  ): Promise<GeneratedThumbnail[]>;
}