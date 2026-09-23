import type { Request, Response, NextFunction } from "express";
import { uploadService, fileService, downloadService, sharingService } from "../../services";
import {
  requireString,
  requirePositiveInt,
  optionalString,
  optionalEnum,
  requireParam,
} from "../validation";
import { AuthenticationRequiredError } from "../../domain/authorization.errors";
import type { AuthenticatedUser } from "../../domain/actor";
import type { FileEntity } from "../../domain/file";

const VISIBILITY_VALUES = ["PUBLIC", "PRIVATE", "SHARED"] as const;
const GRANTEE_TYPE_VALUES = ["USER", "LINK", "GROUP"] as const;
const ACCESS_LEVEL_VALUES = ["READ", "WRITE"] as const;

function requireUserActor(req: Request): AuthenticatedUser {
  if (req.actor.kind !== "user") throw new AuthenticationRequiredError();
  return req.actor;
}

// bigint doesn't survive JSON.stringify — serialize explicitly at the API boundary.
function serializeFile(file: FileEntity) {
  return {
    ...file,
    sizeBytes: file.sizeBytes.toString(),
  };
}

export const filesController = {
  async requestUploadUrl(req: Request, res: Response, next: NextFunction) {
    try {
      const actor = requireUserActor(req);

      const result = await uploadService.requestUpload(actor, {
        filename: requireString(req.body, "filename"),
        contentType: requireString(req.body, "content_type"),
        sizeBytes: requirePositiveInt(req.body, "size_bytes"),
        folderId: optionalString(req.body, "folder_id") ?? null,
        visibility: optionalEnum(req.body, "visibility", VISIBILITY_VALUES),
      });

      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  },

  async completeUpload(req: Request, res: Response, next: NextFunction) {
    try {
      const actor = requireUserActor(req);
      const fileId = requireParam(req.params, "id");

      const file = await uploadService.completeUpload(actor, fileId);

      res.json(serializeFile(file));
    } catch (err) {
      next(err);
    }
  },

  async getFile(req: Request, res: Response, next: NextFunction) {
    try {
      const fileId = requireParam(req.params, "id");

      const file = await fileService.getFile(req.actor, fileId);

      res.json(serializeFile(file));
    } catch (err) {
      next(err);
    }
  },

  async getDownloadUrl(req: Request, res: Response, next: NextFunction) {
    try {
      const fileId = requireParam(req.params, "id");

      const url = await downloadService.getDownloadUrl(req.actor, fileId);

      res.json({ downloadUrl: url });
    } catch (err) {
      next(err);
    }
  },

  async listFiles(req: Request, res: Response, next: NextFunction) {
    try {
      const actor = requireUserActor(req);
      const query = req.query as Record<string, string | string[] | undefined>;

      const result = await fileService.listFiles(actor, {
        folderId: optionalString(query, "folder_id") ?? undefined,
        visibility: optionalEnum(query, "visibility", VISIBILITY_VALUES),
        cursor: optionalString(query, "cursor"),
        limit: typeof query.limit === "string" ? Number(query.limit) : undefined,
      });

      res.json({
        items: result.items.map(serializeFile),
        nextCursor: result.nextCursor,
      });
    } catch (err) {
      next(err);
    }
  },

  async updateFile(req: Request, res: Response, next: NextFunction) {
    try {
      const fileId = requireParam(req.params, "id");

      const file = await fileService.updateFile(req.actor, fileId, {
        folderId: optionalString(req.body, "folder_id"),
        visibility: optionalEnum(req.body, "visibility", VISIBILITY_VALUES),
      });

      res.json(serializeFile(file));
    } catch (err) {
      next(err);
    }
  },

  async deleteFile(req: Request, res: Response, next: NextFunction) {
    try {
      const fileId = requireParam(req.params, "id");

      await fileService.deleteFile(req.actor, fileId);

      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },

  async grantShare(req: Request, res: Response, next: NextFunction) {
    try {
      const fileId = requireParam(req.params, "id");

      const grant = await sharingService.grant(req.actor, fileId, {
        granteeType: optionalEnum(req.body, "grantee_type", GRANTEE_TYPE_VALUES) ?? "USER",
        granteeId: optionalString(req.body, "grantee_id"),
        accessLevel: optionalEnum(req.body, "access_level", ACCESS_LEVEL_VALUES),
      });

      res.status(201).json(grant);
    } catch (err) {
      next(err);
    }
  },

  async listShares(req: Request, res: Response, next: NextFunction) {
    try {
      const fileId = requireParam(req.params, "id");

      const grants = await sharingService.listGrants(req.actor, fileId);

      res.json({ items: grants });
    } catch (err) {
      next(err);
    }
  },

  async revokeShare(req: Request, res: Response, next: NextFunction) {
    try {
      const fileId = requireParam(req.params, "id");
      const permissionId = requireParam(req.params, "permissionId");

      await sharingService.revoke(req.actor, fileId, permissionId);

      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
};