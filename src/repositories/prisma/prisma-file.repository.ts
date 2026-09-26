import type { PrismaClient, Prisma } from "@prisma/client";
import type { FileRepository, FileListFilters } from "../file-repository.interface";
import type { FileEntity, CreateFileInput, UpdateFileInput } from "../../domain/file";
import type { ThumbnailStatus } from "../../domain/file";

export class PrismaFileRepository implements FileRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(input: CreateFileInput): Promise<FileEntity> {
    return this.prisma.file.create({
      data: {
        ownerId: input.ownerId,
        folderId: input.folderId ?? null,
        key: input.key,
        originalName: input.originalName,
        mimeType: input.mimeType,
        sizeBytes: input.sizeBytes,
        visibility: input.visibility ?? "PRIVATE",
        expiresAt: input.expiresAt ?? null,
        status: "PENDING",
        thumbnailStatus: input.mimeType.startsWith("image/") ? "PENDING" : "NOT_APPLICABLE",
      },
    });
  }

  async findById(id: string, opts?: { includeDeleted?: boolean }): Promise<FileEntity | null> {
    return this.prisma.file.findFirst({
      where: {
        id,
        ...(opts?.includeDeleted ? {} : { deletedAt: null }),
      },
    });
  }

  async findByKey(key: string): Promise<FileEntity | null> {
    return this.prisma.file.findUnique({ where: { key } });
  }

  async list(filters: FileListFilters) {
    const limit = filters.limit ?? 50;

    const where: Prisma.FileWhereInput = {
      ownerId: filters.ownerId,
      ...(filters.folderId !== undefined ? { folderId: filters.folderId } : {}),
      ...(filters.visibility ? { visibility: filters.visibility } : {}),
      ...(filters.includeDeleted ? {} : { deletedAt: null }),
    };

    const items = await this.prisma.file.findMany({
      where,
      take: limit + 1,
      ...(filters.cursor ? { cursor: { id: filters.cursor }, skip: 1 } : {}),
      orderBy: { createdAt: "desc" },
    });

    const hasMore = items.length > limit;
    const page = hasMore ? items.slice(0, limit) : items;

    return {
    items: page,
    nextCursor: hasMore ? page[page.length - 1]?.id ?? null : null,
  };
  }

  async update(id: string, input: UpdateFileInput): Promise<FileEntity> {
    return this.prisma.file.update({ where: { id }, data: input });
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.file.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async hardDelete(id: string): Promise<void> {
    await this.prisma.file.delete({ where: { id } });
  }

  async findExpiredPendingUploads(before: Date): Promise<FileEntity[]> {
    return this.prisma.file.findMany({
      where: { status: "PENDING", createdAt: { lt: before } },
    });
  }

  async findSoftDeletedPast(cutoff: Date): Promise<FileEntity[]> {
    return this.prisma.file.findMany({
      where: { deletedAt: { lt: cutoff, not: null } },
    });
  }

  async findByThumbnailStatus(statuses: ThumbnailStatus[], olderThan: Date): Promise<FileEntity[]> {
  return this.prisma.file.findMany({
    where: {
      thumbnailStatus: { in: statuses },
      updatedAt: { lt: olderThan },
      deletedAt: null,
    },
  });
}

async findOrphanedUploads(before: Date): Promise<FileEntity[]> {
  return this.prisma.file.findMany({
    where: {
      status: "PENDING",
      uploadSession: null,
      createdAt: { lt: before },
    },
  });
}
}