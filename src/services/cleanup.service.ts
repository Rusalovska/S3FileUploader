import type { FileRepository } from "../repositories/file-repository.interface";
import type { UploadSessionRepository } from "../repositories/upload-session-repository.interface";
import type { PermissionRepository } from "../repositories/permission-repository.interface";
import type { StorageProvider } from "../domain/storage";
import type { CleanupConfig, CleanupRunSummary } from "../domain/cleanup";
import { StorageKey } from "../storage/storage-key";
import { eventBus } from "../events/event-bus";

export class CleanupService {
  constructor(
    private readonly files: FileRepository,
    private readonly uploadSessions: UploadSessionRepository,
    private readonly permissions: PermissionRepository,
    private readonly storage: StorageProvider,
    private readonly config: CleanupConfig
  ) {}

  async run(): Promise<CleanupRunSummary> {
    const startedAt = Date.now();
    const summary: CleanupRunSummary = {
      expiredUploadSessionsRemoved: 0,
      expiredPendingFilesRemoved: 0,
      softDeletedFilesHardDeleted: 0,
      orphanedStorageObjectsReclaimed: 0,
      expiredPermissionsRevoked: 0,
      stuckThumbnailsRetried: 0,
      durationMs: 0,
      errors: [],
    };

    await this.safely(summary, "expired-upload-sessions", () => this.reclaimExpiredUploads(summary));
    await this.safely(summary, "soft-deleted-files", () => this.hardDeleteAgedSoftDeletes(summary));
    await this.safely(summary, "expired-permissions", () => this.revokeExpiredPermissions(summary));
    await this.safely(summary, "stuck-thumbnails", () => this.retryStuckThumbnails(summary));

    summary.durationMs = Date.now() - startedAt;
    return summary;
  }

  private async reclaimExpiredUploads(summary: CleanupRunSummary): Promise<void> {
    const cutoff = new Date(Date.now() - this.config.pendingUploadExpiryHours * 3600_000);

    const expiredSessions = await this.uploadSessions.findExpiredIncomplete(new Date());
    for (const session of expiredSessions) {
      const file = await this.files.findById(session.fileId, { includeDeleted: true });

      if (file) {
        await this.storage.deleteObject(file.key).catch(() => void 0);
        await this.files.hardDelete(file.id);
        summary.expiredPendingFilesRemoved++;
      }

      await this.uploadSessions.deleteById(session.id);
      summary.expiredUploadSessionsRemoved++;
    }

    const orphaned = await this.files.findOrphanedUploads(cutoff);
    for (const file of orphaned) {
      await this.storage.deleteObject(file.key).catch(() => void 0);
      await this.files.hardDelete(file.id);
      summary.expiredPendingFilesRemoved++;
    }
  }

  private async hardDeleteAgedSoftDeletes(summary: CleanupRunSummary): Promise<void> {
  const cutoff = new Date(Date.now() - this.config.softDeleteGraceDays * 86_400_000);
  const toDelete = await this.files.findSoftDeletedPast(cutoff);

  const keysToDelete: string[] = [];
  for (const file of toDelete) {
    keysToDelete.push(file.key);
    if (file.thumbnailKey) keysToDelete.push(file.thumbnailKey);
  }

  if (keysToDelete.length > 0) {
    await this.storage.deleteObjects(keysToDelete);
    summary.orphanedStorageObjectsReclaimed += keysToDelete.length;
  }

  for (const file of toDelete) {
    await this.files.hardDelete(file.id);
    summary.softDeletedFilesHardDeleted++;
  }
}

  private async revokeExpiredPermissions(summary: CleanupRunSummary): Promise<void> {
    const count = await this.permissions.deleteExpired(new Date());
    summary.expiredPermissionsRevoked = count;
  }


  private async retryStuckThumbnails(summary: CleanupRunSummary): Promise<void> {
    const cutoff = new Date(Date.now() - this.config.stuckThumbnailRetryMinutes * 60_000);
    const stuck = await this.files.findByThumbnailStatus(["PENDING", "PROCESSING"], cutoff);

    for (const file of stuck) {
      eventBus.emit("file.uploaded", { fileId: file.id, mimeType: file.mimeType, key: file.key });
      summary.stuckThumbnailsRetried++;
    }
  }

  private async safely(
    summary: CleanupRunSummary,
    phase: string,
    fn: () => Promise<void>
  ): Promise<void> {
    try {
      await fn();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      summary.errors.push(`[${phase}] ${message}`);
      console.error(`Cleanup phase "${phase}" failed:`, err);
    }
  }
}