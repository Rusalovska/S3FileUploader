import type { Request, Response, NextFunction } from "express";
import { folderService } from "../../services";
import { requireString, optionalString, requireParam } from "../validation";
import { AuthenticationRequiredError } from "../../domain/authorization.errors";
import type { AuthenticatedUser } from "../../domain/actor";

function requireUserActor(req: Request): AuthenticatedUser {
  if (req.actor.kind !== "user") throw new AuthenticationRequiredError();
  return req.actor;
}

export const foldersController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const actor = requireUserActor(req);

      const folder = await folderService.createFolder(
        actor,
        requireString(req.body, "name"),
        optionalString(req.body, "parent_id") ?? null
      );

      res.status(201).json(folder);
    } catch (err) {
      next(err);
    }
  },

  async get(req: Request, res: Response, next: NextFunction) {
    try {
      const actor = requireUserActor(req);
      const folderId = requireParam(req.params, "id");

      const folder = await folderService.getFolder(actor, folderId);

      res.json(folder);
    } catch (err) {
      next(err);
    }
  },

  async listChildren(req: Request, res: Response, next: NextFunction) {
    try {
      const actor = requireUserActor(req);
      const query = req.query as Record<string, string | string[] | undefined>;
      const parentId = optionalString(query, "parent_id") ?? null;

      const children = await folderService.listChildren(actor, parentId);

      res.json({ items: children });
    } catch (err) {
      next(err);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const actor = requireUserActor(req);
      const folderId = requireParam(req.params, "id");

      const name = optionalString(req.body, "name");
      const parentId = optionalString(req.body, "parent_id");

      let folder = await folderService.getFolder(actor, folderId);

      if (name !== undefined) {
        folder = await folderService.renameFolder(actor, folderId, name);
      }
      if (parentId !== undefined) {
        folder = await folderService.moveFolder(actor, folderId, parentId);
      }

      res.json(folder);
    } catch (err) {
      next(err);
    }
  },

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const actor = requireUserActor(req);
      const folderId = requireParam(req.params, "id");

      await folderService.deleteFolder(actor, folderId);

      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
};