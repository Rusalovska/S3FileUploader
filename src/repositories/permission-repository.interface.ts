import type { PermissionEntity, CreatePermissionInput } from "../domain/permission";

export interface PermissionRepository {
  create(input: CreatePermissionInput): Promise<PermissionEntity>;
  findForFile(fileId: string): Promise<PermissionEntity[]>;
  findGrant(fileId: string, granteeType: PermissionEntity["granteeType"], granteeId: string): Promise<PermissionEntity | null>;
  revoke(id: string): Promise<void>;
  deleteExpired(before: Date): Promise<number>;
}