import { Router } from "express";
import { filesController } from "./controllers/files.controller";
import { foldersController } from "./controllers/folders.controller";
import { validate } from "./middleware/validate";
import { uploadRateLimiter } from "./middleware/rate-limit";
import {
  requestUploadUrlSchema,
  updateFileSchema,
  listFilesQuerySchema,
  grantShareSchema,
} from "./schemas/file.schemas";
import { createFolderSchema, updateFolderSchema, listFoldersQuerySchema } from "./schemas/folder.schemas";

export const router = Router();

router.post(
  "/files/upload-url",
  uploadRateLimiter,
  validate({ body: requestUploadUrlSchema }),
  filesController.requestUploadUrl
);
router.post("/files/:id/complete", filesController.completeUpload);
router.get("/files/:id", filesController.getFile);
router.get("/files/:id/download-url", filesController.getDownloadUrl);
router.get("/files/:id/share", filesController.listShares);
router.get("/files", validate({ query: listFilesQuerySchema }), filesController.listFiles);
router.patch("/files/:id", validate({ body: updateFileSchema }), filesController.updateFile);
router.delete("/files/:id", filesController.deleteFile);
router.post("/files/:id/share", validate({ body: grantShareSchema }), filesController.grantShare);
router.delete("/files/:id/share/:permissionId", filesController.revokeShare);

router.post("/folders", validate({ body: createFolderSchema }), foldersController.create);
router.get("/folders", validate({ query: listFoldersQuerySchema }), foldersController.listChildren);
router.get("/folders/:id", foldersController.get);
router.patch("/folders/:id", validate({ body: updateFolderSchema }), foldersController.update);
router.delete("/folders/:id", foldersController.remove);

router.post("/webhooks/storage/object-created", (req, res, next) => next());