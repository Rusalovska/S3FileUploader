import { eventBus } from "../events/event-bus";
import { fileRepository } from "../repositories";
import { storageProvider } from "../storage";
import { ThumbnailWorker } from "./thumbnail.worker";
import { SharpThumbnailService } from "../services/sharp-thumbnail.service";

const thumbnailService = new SharpThumbnailService();
const thumbnailWorker = new ThumbnailWorker(fileRepository, storageProvider, thumbnailService);

eventBus.on("file.uploaded", (event) => {
  void thumbnailWorker.handle(event).catch((err) => {
    console.error("Unhandled thumbnail worker error:", err);
  });
});