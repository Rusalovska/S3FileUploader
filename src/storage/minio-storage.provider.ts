import { S3StorageProvider, type S3StorageConfig } from "./s3-storage.provider";

export class MinioStorageProvider extends S3StorageProvider {
  constructor(config: S3StorageConfig) {
    super({ ...config, forcePathStyle: true });
  }
}