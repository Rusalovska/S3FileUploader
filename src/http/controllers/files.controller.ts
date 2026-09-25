import type { Request, Response, NextFunction } from "express";
import { uploadService, fileService, downloadService, sharingService } from "../../services";
import { requireParam } from "../validation";
import { AuthenticationRequiredError } from "../../domain/authorization.errors";
import type { AuthenticatedUser } from "../../domain/actor";
import type { FileEntity } from "../../domain/file";
import type {
  requestUploadUrlSchema,
  updateFileSchema,
  listFilesQuerySchema,
  grantShareSchema,
} from "../schemas/file.schemas";
import type { z } from "zod";

function requireUserActor(req: Request): AuthenticatedUser {
  if (req.actor.kind !== "user") throw new AuthenticationRequiredError();
  return req.actor;
}

function serializeFile(file: FileEntity) {
  return { ...file, sizeBytes: file.sizeBytes.toString() };
}

export const filesController = {
  async requestUploadUrl(req: Request, res: Response, next: NextFunction) {
    try {
      const actor = requireUserActor(req);
      const body = req.validated.body as z.infer<typeof requestUploadUrlSchema>;

      const result = await uploadService.requestUpload(actor, {
        filename: body.filename,
        contentType: body.content_type,
        sizeBytes: body.size_bytes,
        folderId: body.folder_id ?? null,
        visibility: body.visibility,
      });

      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  },

  async completeUpload(req: Request, res: Response, next: NextFunction) {
    try {
      const actor = requireUserActor(req);
      const file = await uploadService.completeUpload(actor, requireParam(req.params, "id"));
      res.json(serializeFile(file));
    } catch (err) {
      next(err);
    }
  },

  async getFile(req: Request, res: Response, next: NextFunction) {
    try {
      const file = await fileService.getFile(req.actor, requireParam(req.params, "id"));
      res.json(serializeFile(file));
    } catch (err) {
      next(err);
    }
  },

  async getDownloadUrl(req: Request, res: Response, next: NextFunction) {
    try {
      const url = await downloadService.getDownloadUrl(req.actor, requireParam(req.params, "id"));
      res.json({ downloadUrl: url });
    } catch (err) {
      next(err);
    }
  },

  async listFiles(req: Request, res: Response, next: NextFunction) {
    try {
      const actor = requireUserActor(req);
      const query = req.validated.query as z.infer<typeof listFilesQuerySchema>;

      const result = await fileService.listFiles(actor, {
        folderId: query.folder_id,
        visibility: query.visibility,
        cursor: query.cursor,
        limit: query.limit,
      });

      res.json({ items: result.items.map(serializeFile), nextCursor: result.nextCursor });
    } catch (err) {
      next(err);
    }
  },

  async updateFile(req: Request, res: Response, next: NextFunction) {
    try {
      const body = req.validated.body as z.infer<typeof updateFileSchema>;
      const file = await fileService.updateFile(req.actor, requireParam(req.params, "id"), {
        folderId: body.folder_id,
        visibility: body.visibility,
      });
      res.json(serializeFile(file));
    } catch (err) {
      next(err);
    }
  },

  async deleteFile(req: Request, res: Response, next: NextFunction) {
    try {
      await fileService.deleteFile(req.actor, requireParam(req.params, "id"));
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },

  async grantShare(req: Request, res: Response, next: NextFunction) {
    try {
      const body = req.validated.body as z.infer<typeof grantShareSchema>;
      const grant = await sharingService.grant(req.actor, requireParam(req.params, "id"), {
        granteeType: body.grantee_type,
        granteeId: body.grantee_id,
        accessLevel: body.access_level,
        expiresAt: body.expires_at,
      });
      res.status(201).json(grant);
    } catch (err) {
      next(err);
    }
  },

  async listShares(req: Request, res: Response, next: NextFunction) {
    try {
      const grants = await sharingService.listGrants(req.actor, requireParam(req.params, "id"));
      res.json({ items: grants });
    } catch (err) {
      next(err);
    }
  },

  async revokeShare(req: Request, res: Response, next: NextFunction) {
    try {
      await sharingService.revoke(
        req.actor,
        requireParam(req.params, "id"),
        requireParam(req.params, "permissionId")
      );
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
};