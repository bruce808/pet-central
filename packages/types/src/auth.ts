import { Role, UserStatus } from './enums';

export interface RegisterDto {
  email: string;
  password: string;
  displayName: string;
  captchaToken: string;
}

export interface LoginDto {
  email: string;
  password: string;
  captchaToken?: string;
  deviceFingerprint?: string;
}

export interface VerifyEmailDto {
  token: string;
}

export interface VerifyPhoneDto {
  phoneE164: string;
  otpCode: string;
}

export interface MfaSetupResponse {
  secret: string;
  qrCodeUrl: string;
}

export interface MfaVerifyDto {
  code: string;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface RefreshTokenDto {}

export interface JwtPayload {
  sub: string;
  email: string;
  roles: Role[];
  orgId?: string;
  sessionId: string;
}

export interface AuthResponse {
  accessToken: string;
  user: {
    id: string;
    email: string;
    displayName: string;
    roles: Role[];
    emailVerifiedAt: string | null;
    phoneVerifiedAt: string | null;
    status: UserStatus;
  };
}
