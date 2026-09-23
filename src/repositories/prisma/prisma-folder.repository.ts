import type { PrismaClient } from "@prisma/client";
import type { FolderRepository } from "../folder-repository.interface";
import type { FolderEntity, CreateFolderInput } from "../../domain/folder";

export class PrismaFolderRepository implements FolderRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(input: CreateFolderInput): Promise<FolderEntity> {
    let path = "/";
    if (input.parentId) {
      const parent = await this.prisma.folder.findUniqueOrThrow({ where: { id: input.parentId } });
      path = parent.path;
    }

    const folder = await this.prisma.folder.create({
      data: {
        ownerId: input.ownerId,
        parentId: input.parentId ?? null,
        name: input.name,
        path, 
      },
    });

    const finalPath = `${path}${folder.id}/`;
    return this.prisma.folder.update({ where: { id: folder.id }, data: { path: finalPath } });
  }

  async findById(id: string): Promise<FolderEntity | null> {
    return this.prisma.folder.findUnique({ where: { id } });
  }

  async findChildren(parentId: string | null, ownerId: string): Promise<FolderEntity[]> {
    return this.prisma.folder.findMany({ where: { parentId, ownerId } });
  }

  async findSubtree(path: string): Promise<FolderEntity[]> {
    return this.prisma.folder.findMany({ where: { path: { startsWith: path } } });
  }

  async rename(id: string, name: string): Promise<FolderEntity> {
    return this.prisma.folder.update({ where: { id }, data: { name } });
  }

  async move(id: string, newParentId: string | null): Promise<FolderEntity> {
    return this.prisma.$transaction(async (tx) => {
      const folder = await tx.folder.findUniqueOrThrow({ where: { id } });
      const oldPath = folder.path;

      const newParentPath = newParentId
        ? (await tx.folder.findUniqueOrThrow({ where: { id: newParentId } })).path
        : "/";
      const newPath = `${newParentPath}${id}/`;

      const descendants = await tx.folder.findMany({ where: { path: { startsWith: oldPath } } });
      await Promise.all(
        descendants.map((d) =>
          tx.folder.update({
            where: { id: d.id },
            data: { path: newPath + d.path.slice(oldPath.length) },
          })
        )
      );

      return tx.folder.update({ where: { id }, data: { parentId: newParentId, path: newPath } });
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.folder.delete({ where: { id } }); 
  }
}