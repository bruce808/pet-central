import type { JwtPayload } from "./jwt.ts";

export const CURRENT_USER_KEY = "auth:current_user";
export const MFA_REQUIRED_KEY = "auth:mfa_required";

export type CurrentUserPayload = JwtPayload;
export type RolesMetadata = string[];
export type PermissionsMetadata = string[];
