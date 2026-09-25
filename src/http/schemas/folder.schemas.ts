import { z } from "zod";

export const createFolderSchema = z.object({
  name: z.string().min(1).max(255),
  parent_id: z.string().uuid().nullable().optional(),
});

export const updateFolderSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  parent_id: z.string().uuid().nullable().optional(),
});

export const listFoldersQuerySchema = z.object({
  parent_id: z.string().uuid().optional(),
});