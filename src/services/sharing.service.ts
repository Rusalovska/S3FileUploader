import { randomUUID } from "node:crypto";
import type { PermissionRepository } from "../repositories/permission-repository.interface";
import type { FileAccessGuard } from "./file-access.guard";
import type { Actor, AuthenticatedUser } from "../domain/actor";
import type { AccessLevel, GranteeType, PermissionEntity } from "../domain/permission";
import { BadRequestError } from "../domain/authorization.errors";

export interface GrantInput {
  granteeType: GranteeType;
  granteeId?: string;
  accessLevel?: AccessLevel;
  expiresAt?: Date;
}

export class SharingService {
  constructor(
    private readonly permissions: PermissionRepository,
    private readonly guard: FileAccessGuard
  ) {}

  async grant(actor: Actor, fileId: string, input: GrantInput): Promise<PermissionEntity> {
    const file = await this.guard.require(actor, fileId, "file:share");

    const granteeId =
      input.granteeType === "LINK" ? randomUUID() : input.granteeId;

    if (!granteeId) {
      throw new BadRequestError("granteeId is required for USER/GROUP grants");
    }

    const created = await this.permissions.create({
      fileId: file.id,
      granteeType: input.granteeType,
      granteeId,
      accessLevel: input.accessLevel ?? "READ",
      grantedById: actor.kind === "user" ? actor.userId : null,
      expiresAt: input.expiresAt ?? null,
    });

    if (file.visibility === "PRIVATE") {
    }

    return created;
  }

  async listGrants(actor: Actor, fileId: string): Promise<PermissionEntity[]> {
    await this.guard.require(actor, fileId, "file:read");
    return this.permissions.findForFile(fileId);
  }

  async revoke(actor: Actor, fileId: string, permissionId: string): Promise<void> {
    await this.guard.require(actor, fileId, "file:share");
    await this.permissions.revoke(permissionId);
  }
}