import type { Request, Response, NextFunction } from "express";
import { fileRepository } from "../../repositories";
import { eventBus } from "../../events/event-bus";
import { requireString } from "../validation";

export const webhooksController = {
  async objectCreated(req: Request, res: Response, next: NextFunction) {
    try {
      const key = requireString(req.body, "key");

      const file = await fileRepository.findByKey(key);
      if (!file) {
        res.status(204).send();
        return;
      }

      eventBus.emit("file.uploaded", { fileId: file.id, mimeType: file.mimeType, key: file.key });
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
};