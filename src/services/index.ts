import { permissionRepository, fileRepository } from "../repositories";
import { PermissionService } from "./permission.service";
import { FileAccessGuard } from "./file-access.guard";
import { JwtTokenService } from "./jwt-token.service";

export const tokenService = new JwtTokenService({
  secret: process.env.JWT_SECRET!,
  expiresIn: process.env.JWT_EXPIRY ?? "1h",
});

export const permissionService = new PermissionService(permissionRepository);
export const fileAccessGuard = new FileAccessGuard(fileRepository, permissionService);