export interface SessionData {
  userId: string;
  sessionId: string;
  deviceFingerprint?: string;
  ipAddress?: string;
  expiresAt: Date;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  roles: string[];
  emailVerified: boolean;
  phoneVerified: boolean;
  mfaEnabled: boolean;
  orgMemberships: { orgId: string; role: string }[];
}
