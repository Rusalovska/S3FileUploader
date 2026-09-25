import { cleanupService } from "../services";
import { CleanupJob } from "./cleanup.job";

export const cleanupJob = new CleanupJob(
  cleanupService,
  process.env.CLEANUP_CRON_SCHEDULE ?? "0 * * * *"
);