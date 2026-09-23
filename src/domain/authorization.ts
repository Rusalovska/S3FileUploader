
export type FileAction =
  | "file:read"      
  | "file:write"     
  | "file:delete"    
  | "file:share"     
  | "file:download";

export type FolderAction = "folder:read" | "folder:write" | "folder:delete";

export type DenyReason =
  | "NOT_FOUND"          
  | "NOT_AUTHENTICATED"
  | "NOT_OWNER"
  | "NO_GRANT"
  | "GRANT_EXPIRED"
  | "INSUFFICIENT_LEVEL"
  | "FILE_DELETED";

export type AuthorizationResult =
  | { allowed: true }
  | { allowed: false; reason: DenyReason };

export const ALLOW: AuthorizationResult = { allowed: true };

export function deny(reason: DenyReason): AuthorizationResult {
  return { allowed: false, reason };
}