export type GranteeType = "USER" | "LINK" | "GROUP";
export type AccessLevel = "READ" | "WRITE";

export interface PermissionEntity {
  id: string;
  fileId: string;
  granteeType: GranteeType;
  granteeId: string;
  accessLevel: AccessLevel;
  grantedById: string | null;
  expiresAt: Date | null;
  createdAt: Date;
}

export interface CreatePermissionInput {
  fileId: string;
  granteeType: GranteeType;
  granteeId: string;
  accessLevel?: AccessLevel;
  grantedById?: string | null;
  expiresAt?: Date | null;
}