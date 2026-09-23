import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  type S3ClientConfig,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { Readable } from "node:stream";

import type {
  StorageProvider,
  UploadUrlParams,
  PresignedUpload,
  DownloadOpts,
  ObjectMetadata,
  PutObjectOptions,
} from "../domain/storage";
import {
  StorageError,
  ObjectNotFoundError,
  StorageAccessDeniedError,
  StorageUnavailableError,
} from "./storage.errors";

export interface S3StorageConfig {
  bucket: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  endpoint?: string;
  forcePathStyle: boolean;
  presignExpirySeconds: number;
}

export class S3StorageProvider implements StorageProvider {
  protected readonly client: S3Client;
  protected readonly bucket: string;
  protected readonly defaultExpiry: number;

  constructor(private readonly config: S3StorageConfig) {
    const clientConfig: S3ClientConfig = {
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
      forcePathStyle: config.forcePathStyle,
    };

    if (config.endpoint) {
      clientConfig.endpoint = config.endpoint;
    }

    this.client = new S3Client(clientConfig);
    this.bucket = config.bucket;
    this.defaultExpiry = config.presignExpirySeconds;
  }

  async generateUploadUrl(params: UploadUrlParams): Promise<PresignedUpload> {
    const expiresIn = params.expiresInSeconds ?? this.defaultExpiry;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: params.key,
      ContentType: params.contentType,
      ...(params.contentLength !== undefined ? { ContentLength: params.contentLength } : {}),
      ...(params.metadata ? { Metadata: params.metadata } : {}),
    });

    try {
      const url = await getSignedUrl(this.client, command, { expiresIn });

      const headers: Record<string, string> = { "Content-Type": params.contentType };
      if (params.contentLength !== undefined) {
        headers["Content-Length"] = String(params.contentLength);
      }
      for (const [k, v] of Object.entries(params.metadata ?? {})) {
        headers[`x-amz-meta-${k}`] = v;
      }

      return {
        url,
        method: "PUT",
        headers,
        expiresAt: new Date(Date.now() + expiresIn * 1000),
      };
    } catch (err) {
      throw this.mapError(err, params.key);
    }
  }

  async generateDownloadUrl(key: string, opts?: DownloadOpts): Promise<string> {
    const expiresIn = opts?.expiresInSeconds ?? this.defaultExpiry;

    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ...(opts?.downloadFilename
        ? { ResponseContentDisposition: `attachment; filename="${opts.downloadFilename}"` }
        : {}),
      ...(opts?.responseContentType ? { ResponseContentType: opts.responseContentType } : {}),
    });

    try {
      return await getSignedUrl(this.client, command, { expiresIn });
    } catch (err) {
      throw this.mapError(err, key);
    }
  }

  async headObject(key: string): Promise<ObjectMetadata | null> {
    try {
      const res = await this.client.send(
        new HeadObjectCommand({ Bucket: this.bucket, Key: key })
      );

      return {
        key,
        sizeBytes: BigInt(res.ContentLength ?? 0),
        contentType: res.ContentType ?? "application/octet-stream",
        etag: (res.ETag ?? "").replace(/"/g, ""),
        lastModified: res.LastModified ?? new Date(),
        metadata: res.Metadata ?? {},
      };
    } catch (err) {
      if (this.isNotFound(err)) return null;
      throw this.mapError(err, key);
    }
  }

  async objectExists(key: string): Promise<boolean> {
    return (await this.headObject(key)) !== null;
  }

  async getObjectStream(key: string): Promise<Readable> {
    try {
      const res = await this.client.send(
        new GetObjectCommand({ Bucket: this.bucket, Key: key })
      );

      if (!res.Body) throw new ObjectNotFoundError(key);
      return res.Body as Readable;
    } catch (err) {
      if (this.isNotFound(err)) throw new ObjectNotFoundError(key, err);
      throw this.mapError(err, key);
    }
  }

  async putObject(key: string, body: Buffer | Readable, opts: PutObjectOptions): Promise<void> {
    try {
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: body,
          ContentType: opts.contentType,
          ...(opts.contentLength !== undefined ? { ContentLength: opts.contentLength } : {}),
          ...(opts.metadata ? { Metadata: opts.metadata } : {}),
          ...(opts.cacheControl ? { CacheControl: opts.cacheControl } : {}),
        })
      );
    } catch (err) {
      throw this.mapError(err, key);
    }
  }

  async deleteObject(key: string): Promise<void> {
    try {
      await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
    } catch (err) {
      if (this.isNotFound(err)) return;
      throw this.mapError(err, key);
    }
  }

  async deleteObjects(keys: string[]): Promise<void> {
    if (keys.length === 0) return;

    const chunks: string[][] = [];
    for (let i = 0; i < keys.length; i += 1000) {
      chunks.push(keys.slice(i, i + 1000));
    }

    try {
      for (const chunk of chunks) {
        await this.client.send(
          new DeleteObjectsCommand({
            Bucket: this.bucket,
            Delete: { Objects: chunk.map((Key) => ({ Key })), Quiet: true },
          })
        );
      }
    } catch (err) {
       throw this.mapError(err, `batch(${keys.length} keys)`);
    }
  }

  protected isNotFound(err: unknown): boolean {
    const name = (err as { name?: string })?.name;
    const status = (err as { $metadata?: { httpStatusCode?: number } })?.$metadata?.httpStatusCode;
    return name === "NotFound" || name === "NoSuchKey" || status === 404;
  }

  protected mapError(err: unknown, key: string): StorageError {
    if (this.isNotFound(err)) return new ObjectNotFoundError(key, err);

    const name = (err as { name?: string })?.name;
    const status = (err as { $metadata?: { httpStatusCode?: number } })?.$metadata?.httpStatusCode;

    if (name === "AccessDenied" || status === 403) {
      return new StorageAccessDeniedError(key, err);
    }
    if (status !== undefined && status >= 500) {
      return new StorageUnavailableError(err);
    }
    return new StorageError(
      `Storage operation failed for key "${key}": ${(err as Error)?.message ?? "unknown error"}`,
      err
    );
  }
}