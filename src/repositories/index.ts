import { prisma } from "../db/prisma-client";
import { PrismaFileRepository } from "./prisma/prisma-file.repository";
import { PrismaFolderRepository } from "./prisma/prisma-folder.repository";
import { PrismaPermissionRepository } from "./prisma/prisma-permission.repository";
import { PrismaUploadSessionRepository } from "./prisma/prisma-upload-session";
import { PrismaUserRepository } from "./prisma/prisma-user.repository";

export const userRepository = new PrismaUserRepository(prisma);
export const fileRepository = new PrismaFileRepository(prisma);
export const folderRepository = new PrismaFolderRepository(prisma);
export const permissionRepository = new PrismaPermissionRepository(prisma);
export const uploadSessionRepository = new PrismaUploadSessionRepository(prisma);