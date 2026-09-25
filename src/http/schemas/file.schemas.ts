import { z } from "zod";

export const visibilitySchema = z.enum(["PUBLIC", "PRIVATE", "SHARED"]);
export const granteeTypeSchema = z.enum(["USER", "LINK", "GROUP"]);
export const accessLevelSchema = z.enum(["READ", "WRITE"]);

export const requestUploadUrlSchema = z.object({
  filename: z.string().min(1).max(255),
  content_type: z.string().min(1).max(127),
  size_bytes: z.number().int().positive().max(5 * 1024 * 1024 * 1024),
  folder_id: z.string().uuid().nullable().optional(),
  visibility: visibilitySchema.optional(),
});

export const updateFileSchema = z.object({
  folder_id: z.string().uuid().nullable().optional(),
  visibility: visibilitySchema.optional(),
});

export const listFilesQuerySchema = z.object({
  folder_id: z.string().uuid().optional(),
  visibility: visibilitySchema.optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().positive().max(200).optional(),
});

export const grantShareSchema = z.object({
  grantee_type: granteeTypeSchema.default("USER"),
  grantee_id: z.string().min(1).optional(),
  access_level: accessLevelSchema.optional(),
  expires_at: z.coerce.date().optional(),
});