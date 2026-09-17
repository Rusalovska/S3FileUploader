import type { PrismaClient } from "@prisma/client";
import type { PermissionRepository } from "../permission-repository.interface";
import type { PermissionEntity, CreatePermissionInput } from "../../domain/permission";

export class PrismaPermissionRepository implements PermissionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(input: CreatePermissionInput): Promise<PermissionEntity> {
    return this.prisma.permission.create({
      data: {
        fileId: input.fileId,
        granteeType: input.granteeType,
        granteeId: input.granteeId,
        accessLevel: input.accessLevel ?? "READ",
        grantedById: input.grantedById ?? null,
        expiresAt: input.expiresAt ?? null,
      },
    });
  }

  async findForFile(fileId: string): Promise<PermissionEntity[]> {
    return this.prisma.permission.findMany({ where: { fileId } });
  }

  async findGrant(
    fileId: string,
    granteeType: PermissionEntity["granteeType"],
    granteeId: string
  ): Promise<PermissionEntity | null> {
    return this.prisma.permission.findFirst({ where: { fileId, granteeType, granteeId } });
  }

  async revoke(id: string): Promise<void> {
    await this.prisma.permission.delete({ where: { id } });
  }

  async deleteExpired(before: Date): Promise<number> {
    const result = await this.prisma.permission.deleteMany({
      where: { expiresAt: { lt: before, not: null } },
    });
    return result.count;
  }
}