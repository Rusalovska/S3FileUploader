import { createStorageProvider, type StorageProviderKind } from "./storage.factory";

export const storageProvider = createStorageProvider(
  (process.env.STORAGE_PROVIDER ?? "s3") as StorageProviderKind,
  {
    bucket: process.env.S3_BUCKET!,
    region: process.env.S3_REGION ?? "us-east-1",
    accessKeyId: process.env.S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
    endpoint: process.env.S3_ENDPOINT,
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
    presignExpirySeconds: Number(process.env.S3_PRESIGN_EXPIRY_SECONDS ?? 900),
  }
);

export type { StorageProvider } from "../domain/storage.js";