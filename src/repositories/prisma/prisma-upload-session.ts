import type { PrismaClient } from "@prisma/client";
import type { UploadSessionRepository } from "../upload-repository.interface";
import type { UploadSessionEntity, CreateUploadSessionInput } from "../../domain/upload-session";

export class PrismaUploadSessionRepository implements UploadSessionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(input: CreateUploadSessionInput): Promise<UploadSessionEntity> {
    return this.prisma.uploadSession.create({ data: input });
  }

  async findByFileId(fileId: string): Promise<UploadSessionEntity | null> {
    return this.prisma.uploadSession.findUnique({ where: { fileId } });
  }

  async markCompleted(id: string): Promise<UploadSessionEntity> {
    return this.prisma.uploadSession.update({ where: { id }, data: { completedAt: new Date() } });
  }

  async findExpiredIncomplete(before: Date): Promise<UploadSessionEntity[]> {
    return this.prisma.uploadSession.findMany({
      where: { completedAt: null, expiresAt: { lt: before } },
    });
  }
}