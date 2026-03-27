export enum Permission {
  CREATE_LISTING = "CREATE_LISTING",
  EDIT_LISTING = "EDIT_LISTING",
  DELETE_LISTING = "DELETE_LISTING",
  PUBLISH_LISTING = "PUBLISH_LISTING",
  CREATE_REVIEW = "CREATE_REVIEW",
  MODERATE_REVIEW = "MODERATE_REVIEW",
  SEND_MESSAGE = "SEND_MESSAGE",
  MODERATE_MESSAGE = "MODERATE_MESSAGE",
  CREATE_CASE = "CREATE_CASE",
  ASSIGN_CASE = "ASSIGN_CASE",
  VIEW_CASE = "VIEW_CASE",
  MANAGE_ORGANIZATION = "MANAGE_ORGANIZATION",
  MANAGE_MEMBERS = "MANAGE_MEMBERS",
  UPLOAD_DOCUMENT = "UPLOAD_DOCUMENT",
  MANAGE_BADGES = "MANAGE_BADGES",
  MODERATE_CONTENT = "MODERATE_CONTENT",
  VIEW_AUDIT_LOG = "VIEW_AUDIT_LOG",
  MANAGE_USERS = "MANAGE_USERS",
  MANAGE_PARTNERS = "MANAGE_PARTNERS",
  AI_CHAT = "AI_CHAT",
  AI_CORRESPONDENCE = "AI_CORRESPONDENCE",
  AI_DISCOVERY = "AI_DISCOVERY",
  ADMIN_DASHBOARD = "ADMIN_DASHBOARD",
  VIEW_ANALYTICS = "VIEW_ANALYTICS",
}

const ALL_PERMISSIONS = Object.values(Permission);

const VENDOR_MEMBER_PERMISSIONS: Permission[] = [
  Permission.CREATE_LISTING,
  Permission.EDIT_LISTING,
  Permission.SEND_MESSAGE,
  Permission.CREATE_REVIEW,
  Permission.UPLOAD_DOCUMENT,
];

const SUPPORT_AGENT_PERMISSIONS: Permission[] = [
  Permission.VIEW_CASE,
  Permission.CREATE_CASE,
  Permission.ASSIGN_CASE,
  Permission.MODERATE_CONTENT,
  Permission.MODERATE_REVIEW,
  Permission.MODERATE_MESSAGE,
  Permission.AI_CORRESPONDENCE,
];

export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  authenticated_user: [
    Permission.CREATE_REVIEW,
    Permission.SEND_MESSAGE,
    Permission.AI_CHAT,
  ],
  vendor_member: VENDOR_MEMBER_PERMISSIONS,
  vendor_admin: [
    ...VENDOR_MEMBER_PERMISSIONS,
    Permission.MANAGE_ORGANIZATION,
    Permission.MANAGE_MEMBERS,
    Permission.PUBLISH_LISTING,
    Permission.DELETE_LISTING,
    Permission.VIEW_ANALYTICS,
  ],
  validator: [Permission.VIEW_CASE, Permission.CREATE_CASE],
  nonprofit_partner: [Permission.VIEW_CASE, Permission.CREATE_CASE],
  agency_partner: [Permission.VIEW_CASE, Permission.CREATE_CASE],
  support_agent: SUPPORT_AGENT_PERMISSIONS,
  trust_analyst: [...SUPPORT_AGENT_PERMISSIONS, Permission.MANAGE_BADGES],
  moderator: [
    Permission.MODERATE_CONTENT,
    Permission.MODERATE_REVIEW,
    Permission.MODERATE_MESSAGE,
    Permission.VIEW_CASE,
    Permission.CREATE_CASE,
  ],
  admin: ALL_PERMISSIONS,
};

export function hasPermission(
  userRoles: string[],
  permission: Permission,
): boolean {
  return userRoles.some((role) => {
    const perms = ROLE_PERMISSIONS[role];
    return perms?.includes(permission) ?? false;
  });
}

export function hasAnyPermission(
  userRoles: string[],
  permissions: Permission[],
): boolean {
  return permissions.some((perm) => hasPermission(userRoles, perm));
}

export function getRolePermissions(role: string): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}
