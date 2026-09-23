import type { FileEntity } from "../domain/file";
import type { PermissionEntity, AccessLevel } from "../domain/permission";
import type { PermissionRepository } from "../repositories/permission-repository.interface";
import type { Actor } from "../domain/actor";
import {
  type FileAction,
  type AuthorizationResult,
  ALLOW,
  deny,
} from "../domain/authorization";
import { toHttpError } from "../domain/authorization.http";

const REQUIRED_LEVEL: Record<FileAction, AccessLevel> = {
  "file:read": "READ",
  "file:download": "READ",
  "file:write": "WRITE",
  "file:delete": "WRITE",
  "file:share": "WRITE",
};

const OWNER_ONLY: ReadonlySet<FileAction> = new Set<FileAction>(["file:delete", "file:share"]);

export class PermissionService {
  constructor(private readonly permissions: PermissionRepository) {}

  async canAccessFile(
    actor: Actor,
    file: FileEntity,
    action: FileAction
  ): Promise<AuthorizationResult> {
    if (file.deletedAt !== null) {
      const isOwner = actor.kind === "user" && actor.userId === file.ownerId;
      if (!isOwner) return deny("FILE_DELETED");
    }

    if (file.expiresAt !== null && file.expiresAt.getTime() < Date.now()) {
      return deny("NOT_FOUND");
    }

    if (actor.kind === "user" && actor.userId === file.ownerId) {
      return ALLOW;
    }

    if (OWNER_ONLY.has(action)) {
      return actor.kind === "anonymous" ? deny("NOT_AUTHENTICATED") : deny("NOT_OWNER");
    }

    if (file.visibility === "PUBLIC" && REQUIRED_LEVEL[action] === "READ") {
      return ALLOW;
    }

    if (file.visibility === "PRIVATE") {
      return actor.kind === "anonymous" ? deny("NOT_AUTHENTICATED") : deny("NOT_OWNER");
    }

    return this.checkGrants(actor, file, action);
  }

  private async checkGrants(
    actor: Actor,
    file: FileEntity,
    action: FileAction
  ): Promise<AuthorizationResult> {
    const grants = await this.resolveGrants(actor, file.id);

    if (grants.length === 0) {
      return actor.kind === "anonymous" ? deny("NOT_AUTHENTICATED") : deny("NO_GRANT");
    }

    const now = Date.now();
    const live = grants.filter((g) => g.expiresAt === null || g.expiresAt.getTime() > now);

    if (live.length === 0) return deny("GRANT_EXPIRED");

    const required = REQUIRED_LEVEL[action];
    const satisfied = live.some((g) => this.levelSatisfies(g.accessLevel, required));

    return satisfied ? ALLOW : deny("INSUFFICIENT_LEVEL");
  }

  private async resolveGrants(actor: Actor, fileId: string): Promise<PermissionEntity[]> {
    switch (actor.kind) {
      case "anonymous":
        return [];

      case "link": {
        const grant = await this.permissions.findGrant(fileId, "LINK", actor.linkToken);
        return grant ? [grant] : [];
      }

      case "user": {
        const found: PermissionEntity[] = [];

        const direct = await this.permissions.findGrant(fileId, "USER", actor.userId);
        if (direct) found.push(direct);

        for (const groupId of actor.groupIds) {
          const groupGrant = await this.permissions.findGrant(fileId, "GROUP", groupId);
          if (groupGrant) found.push(groupGrant);
        }

        return found;
      }
    }
  }

  private levelSatisfies(held: AccessLevel, required: AccessLevel): boolean {
    if (required === "READ") return held === "READ" || held === "WRITE";
    return held === "WRITE";
  }


  async assertCanAccessFile(actor: Actor, file: FileEntity, action: FileAction): Promise<void> {
    const result = await this.canAccessFile(actor, file, action);
    if (result.allowed) return;
    throw toHttpError(result.reason);
  }
}