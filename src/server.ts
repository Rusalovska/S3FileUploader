import "dotenv/config";

import { app } from "./http/app";
import "./workers";
import { cleanupJob } from "./jobs";

const port = Number(process.env.PORT ?? 3000);

const server = app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});

cleanupJob.start();

function shutdown(signal: string): void {
  console.log(`${signal} received, shutting down gracefully...`);
  cleanupJob.stop();
  server.close((err) => {
    if (err) {
      console.error("Error during shutdown:", err);
      process.exit(1);
    }
    process.exit(0);
  });

  setTimeout(() => {
    console.error("Forced shutdown after timeout");
    process.exit(1);
  }, 10_000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled promise rejection:", reason);
});