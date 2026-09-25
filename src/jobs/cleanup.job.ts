import cron, { type ScheduledTask } from "node-cron";
import type { CleanupService } from "../services/cleanup.service";

export class CleanupJob {
  private task: ScheduledTask | null = null;
  private running = false;

  constructor(
    private readonly cleanupService: CleanupService,
    private readonly cronSchedule: string
  ) {}

  start(): void {
    if (this.task) return;

    this.task = cron.schedule(this.cronSchedule, () => {
      void this.runOnce();
    });

    console.log(`Cleanup job scheduled: "${this.cronSchedule}"`);
  }

  stop(): void {
    this.task?.stop();
    this.task = null;
  }

  async runOnce(): Promise<void> {
    if (this.running) {
      console.warn("Cleanup job already running, skipping this tick");
      return;
    }

    this.running = true;
    try {
      const summary = await this.cleanupService.run();
      console.log("Cleanup run complete:", summary);
    } catch (err) {
      console.error("Cleanup run failed unexpectedly:", err);
    } finally {
      this.running = false;
    }
  }
}