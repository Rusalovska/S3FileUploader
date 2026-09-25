import { fileRepository, folderRepository, permissionRepository, uploadSessionRepository } from "../repositories";
import { storageProvider } from "../storage";
import { PermissionService } from "./permission.service";
import { FileAccessGuard } from "./file-access.guard";
import { JwtTokenService } from "./jwt-token.service";
import { UploadService } from "./upload.service";
import { FileService } from "./file.service";
import { DownloadService } from "./download.service";
import { FolderService } from "./folder.service";
import { SharingService } from "./sharing.service"; 
import { CleanupService } from "./cleanup.service";

export const tokenService = new JwtTokenService({
  secret: process.env.JWT_SECRET!,
  expiresIn: process.env.JWT_EXPIRY ?? "1h",
});

export const permissionService = new PermissionService(permissionRepository);
export const fileAccessGuard = new FileAccessGuard(fileRepository, permissionService);

export const uploadService = new UploadService(
  fileRepository, folderRepository, uploadSessionRepository, storageProvider
);
export const fileService = new FileService(fileRepository, folderRepository, fileAccessGuard);
export const downloadService = new DownloadService(fileAccessGuard, storageProvider);
export const folderService = new FolderService(folderRepository);
export const sharingService = new SharingService(permissionRepository, fileAccessGuard);
export const cleanupService = new CleanupService(
  fileRepository,
  uploadSessionRepository,
  permissionRepository,
  storageProvider,
  {
    softDeleteGraceDays: Number(process.env.SOFT_DELETE_GRACE_DAYS ?? 30),
    pendingUploadExpiryHours: 24,
    stuckThumbnailRetryMinutes: 30,
  }
);