import type { Readable } from "node:stream";

export type UploadMethod = "PUT" | "POST";

export interface UploadUrlParams {
  key: string;
  contentType: string;
  contentLength?: number;
  expiresInSeconds?: number;
  metadata?: Record<string, string>;
}

export interface PresignedUpload {
  url: string;
  method: UploadMethod;
  headers: Record<string, string>;
  fields?: Record<string, string>;
  expiresAt: Date;
}

export interface DownloadOpts {
  expiresInSeconds?: number;
  downloadFilename?: string;
  responseContentType?: string;
}

export interface ObjectMetadata {
  key: string;
  sizeBytes: bigint;
  contentType: string;
  etag: string;
  lastModified: Date;
  metadata: Record<string, string>;
}

export interface PutObjectOptions {
  contentType: string;
  contentLength?: number;
  metadata?: Record<string, string>;
  cacheControl?: string;
}

export interface StorageProvider {
  generateUploadUrl(params: UploadUrlParams): Promise<PresignedUpload>;
  generateDownloadUrl(key: string, opts?: DownloadOpts): Promise<string>;
  deleteObject(key: string): Promise<void>;
  deleteObjects(keys: string[]): Promise<void>;
  headObject(key: string): Promise<ObjectMetadata | null>;
  getObjectStream(key: string): Promise<Readable>;
  putObject(key: string, body: Buffer | Readable, opts: PutObjectOptions): Promise<void>;
  objectExists(key: string): Promise<boolean>;
}