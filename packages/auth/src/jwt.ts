import jwt, { type SignOptions } from "jsonwebtoken";

export interface JwtPayload {
  sub: string;
  email: string;
  roles: string[];
  orgId?: string;
  sessionId: string;
}

function getEnv(key: string, fallback?: string): string {
  const value = process.env[key] ?? fallback;
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export function generateAccessToken(payload: JwtPayload): string {
  const secret = getEnv("JWT_ACCESS_SECRET");
  const expiresIn = getEnv("JWT_ACCESS_EXPIRY", "15m");
  return jwt.sign(payload, secret, { expiresIn } as SignOptions);
}

export function generateRefreshToken(
  userId: string,
  sessionId: string,
): string {
  const secret = getEnv("JWT_REFRESH_SECRET");
  const expiresIn = getEnv("JWT_REFRESH_EXPIRY", "7d");
  return jwt.sign({ sub: userId, sessionId }, secret, { expiresIn } as SignOptions);
}

export function verifyAccessToken(token: string): JwtPayload {
  const secret = getEnv("JWT_ACCESS_SECRET");
  return jwt.verify(token, secret) as JwtPayload;
}

export function verifyRefreshToken(
  token: string,
): { sub: string; sessionId: string } {
  const secret = getEnv("JWT_REFRESH_SECRET");
  return jwt.verify(token, secret) as { sub: string; sessionId: string };
}
