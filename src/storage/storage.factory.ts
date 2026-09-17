import type { StorageProvider } from "../domain/storage";
import { S3StorageProvider, type S3StorageConfig } from "./s3-storage.provider";
import { MinioStorageProvider } from "./minio-storage.provider";

export type StorageProviderKind = "s3" | "minio";

export function createStorageProvider(
  kind: StorageProviderKind,
  config: S3StorageConfig
): StorageProvider {
  switch (kind) {
    case "minio":
      if (!config.endpoint) {
        throw new Error("S3_ENDPOINT is required when STORAGE_PROVIDER=minio");
      }
      return new MinioStorageProvider(config);
    case "s3":
      return new S3StorageProvider(config);
    default: {
      const _never: never = kind;
      throw new Error(`Unsupported storage provider: ${String(_never)}`);
    }
  }
}