-- CreateEnum
CREATE TYPE "FileStatus" AS ENUM ('PENDING', 'UPLOADED', 'FAILED');

-- CreateEnum
CREATE TYPE "Visibility" AS ENUM ('PUBLIC', 'PRIVATE', 'SHARED');

-- CreateEnum
CREATE TYPE "ThumbnailStatus" AS ENUM ('NOT_APPLICABLE', 'PENDING', 'PROCESSING', 'READY', 'FAILED');

-- CreateEnum
CREATE TYPE "GranteeType" AS ENUM ('USER', 'LINK', 'GROUP');

-- CreateEnum
CREATE TYPE "AccessLevel" AS ENUM ('READ', 'WRITE');

-- CreateEnum
CREATE TYPE "UploadMethod" AS ENUM ('PUT', 'POST');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "folders" (
    "id" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "parent_id" TEXT,
    "name" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "folders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "files" (
    "id" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "folder_id" TEXT,
    "key" TEXT NOT NULL,
    "original_name" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size_bytes" BIGINT NOT NULL,
    "checksum" TEXT,
    "status" "FileStatus" NOT NULL DEFAULT 'PENDING',
    "visibility" "Visibility" NOT NULL DEFAULT 'PRIVATE',
    "thumbnail_key" TEXT,
    "thumbnail_status" "ThumbnailStatus" NOT NULL DEFAULT 'NOT_APPLICABLE',
    "deleted_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" TEXT NOT NULL,
    "file_id" TEXT NOT NULL,
    "grantee_type" "GranteeType" NOT NULL,
    "grantee_id" TEXT NOT NULL,
    "access_level" "AccessLevel" NOT NULL DEFAULT 'READ',
    "granted_by_id" TEXT,
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "upload_sessions" (
    "id" TEXT NOT NULL,
    "file_id" TEXT NOT NULL,
    "presigned_url" TEXT NOT NULL,
    "method" "UploadMethod" NOT NULL DEFAULT 'PUT',
    "expires_at" TIMESTAMP(3) NOT NULL,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "upload_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "folders_owner_id_idx" ON "folders"("owner_id");

-- CreateIndex
CREATE INDEX "folders_parent_id_idx" ON "folders"("parent_id");

-- CreateIndex
CREATE INDEX "folders_path_idx" ON "folders"("path");

-- CreateIndex
CREATE UNIQUE INDEX "files_key_key" ON "files"("key");

-- CreateIndex
CREATE INDEX "files_owner_id_idx" ON "files"("owner_id");

-- CreateIndex
CREATE INDEX "files_folder_id_idx" ON "files"("folder_id");

-- CreateIndex
CREATE INDEX "files_deleted_at_idx" ON "files"("deleted_at");

-- CreateIndex
CREATE INDEX "files_status_expires_at_idx" ON "files"("status", "expires_at");

-- CreateIndex
CREATE INDEX "files_visibility_idx" ON "files"("visibility");

-- CreateIndex
CREATE INDEX "permissions_file_id_idx" ON "permissions"("file_id");

-- CreateIndex
CREATE INDEX "permissions_grantee_type_grantee_id_idx" ON "permissions"("grantee_type", "grantee_id");

-- CreateIndex
CREATE INDEX "permissions_expires_at_idx" ON "permissions"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "upload_sessions_file_id_key" ON "upload_sessions"("file_id");

-- CreateIndex
CREATE INDEX "upload_sessions_expires_at_completed_at_idx" ON "upload_sessions"("expires_at", "completed_at");

-- AddForeignKey
ALTER TABLE "folders" ADD CONSTRAINT "folders_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "folders" ADD CONSTRAINT "folders_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "folders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "files" ADD CONSTRAINT "files_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "files" ADD CONSTRAINT "files_folder_id_fkey" FOREIGN KEY ("folder_id") REFERENCES "folders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "permissions" ADD CONSTRAINT "permissions_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "files"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "permissions" ADD CONSTRAINT "permissions_granted_by_id_fkey" FOREIGN KEY ("granted_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "upload_sessions" ADD CONSTRAINT "upload_sessions_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "files"("id") ON DELETE CASCADE ON UPDATE CASCADE;
