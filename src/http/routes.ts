import { Router } from "express";
import { filesController } from "./controllers/files.controller";
import { foldersController } from "./controllers/folders.controller";

export const router = Router();

router.post("/files/upload-url", filesController.requestUploadUrl);
router.post("/files/:id/complete", filesController.completeUpload);
router.get("/files/:id", filesController.getFile);
router.get("/files/:id/download-url", filesController.getDownloadUrl);
router.get("/files", filesController.listFiles);
router.patch("/files/:id", filesController.updateFile);
router.delete("/files/:id", filesController.deleteFile);
router.post("/files/:id/share", filesController.grantShare);
router.delete("/files/:id/share/:permissionId", filesController.revokeShare);

router.post("/folders", foldersController.create);
router.get("/folders/:id", foldersController.get);
router.patch("/folders/:id", foldersController.update);
router.delete("/folders/:id", foldersController.remove);