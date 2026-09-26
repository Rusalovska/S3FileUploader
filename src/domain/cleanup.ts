export interface CleanupConfig {
  softDeleteGraceDays: number;
  pendingUploadExpiryHours: number;
  stuckThumbnailRetryMinutes: number;
}

export interface CleanupRunSummary {
  expiredUploadSessionsRemoved: number;
  expiredPendingFilesRemoved: number;
  softDeletedFilesHardDeleted: number;
  orphanedStorageObjectsReclaimed: number;
  expiredPermissionsRevoked: number;
  stuckThumbnailsRetried: number;
  durationMs: number;
  errors: string[];
}