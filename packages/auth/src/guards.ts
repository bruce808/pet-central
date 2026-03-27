export const AUTH_GUARD_KEY = "auth:guard";
export const ROLES_KEY = "auth:roles";
export const PERMISSIONS_KEY = "auth:permissions";

export function createAuthGuardMetadata(roles?: string[]): object {
  return {
    [AUTH_GUARD_KEY]: true,
    ...(roles ? { [ROLES_KEY]: roles } : {}),
  };
}

export function createPermissionGuardMetadata(permissions: string[]): object {
  return {
    [PERMISSIONS_KEY]: permissions,
  };
}
