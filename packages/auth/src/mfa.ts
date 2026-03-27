import { authenticator } from "otplib";

export function generateMfaSecret(
  email: string,
): { secret: string; otpauthUrl: string } {
  const secret = authenticator.generateSecret();
  const otpauthUrl = authenticator.keyuri(email, "PetCentral", secret);
  return { secret, otpauthUrl };
}

export function verifyMfaToken(secret: string, token: string): boolean {
  return authenticator.verify({ token, secret });
}
