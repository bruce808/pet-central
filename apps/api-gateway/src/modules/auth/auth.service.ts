import {
  Injectable,
  BadRequestException,
  ConflictException,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/prisma.service';
import {
  hashPassword,
  verifyPassword,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  generateMfaSecret,
  verifyMfaToken,
} from '@pet-central/auth';
import type { JwtPayload } from '@pet-central/auth';

interface RegisterDto {
  email: string;
  password: string;
  displayName: string;
  captchaToken?: string;
  ip?: string;
  userAgent?: string;
}

interface LoginDto {
  email: string;
  password: string;
  captchaToken?: string;
  deviceFingerprint?: string;
  ip?: string;
  userAgent?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    await this.validateCaptcha(dto.captchaToken);

    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    const passwordHash = await hashPassword(dto.password);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash,
        profile: {
          create: { displayName: dto.displayName },
        },
        roles: {
          create: { role: { connect: { name: 'authenticated_user' } } },
        },
      },
      include: {
        profile: true,
        roles: { include: { role: true } },
      },
    });

    const session = await this.createSession(
      user.id,
      undefined,
      dto.ip,
      dto.userAgent,
    );
    const tokens = this.generateTokenPair(user, session.id);

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.profile?.displayName,
        roles: user.roles.map((r) => r.role.name),
      },
    };
  }

  async login(dto: LoginDto) {
    await this.validateCaptcha(dto.captchaToken);

    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
      include: {
        profile: true,
        roles: { include: { role: true } },
      },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isValid = await verifyPassword(user.passwordHash, dto.password);
    if (!isValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.status === 'SUSPENDED') {
      throw new ForbiddenException('Account is suspended');
    }

    const roles = user.roles.map((r) => r.role.name);
    const mfaRequired = user.mfaEnabled && !dto.deviceFingerprint;

    if (mfaRequired) {
      return {
        accessToken: '',
        refreshToken: '',
        mfaRequired: true,
        user: { id: user.id, email: user.email },
      };
    }

    const session = await this.createSession(
      user.id,
      dto.deviceFingerprint,
      dto.ip,
      dto.userAgent,
    );
    const tokens = this.generateTokenPair(user, session.id);

    return {
      ...tokens,
      mfaRequired: false,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.profile?.displayName,
        roles,
      },
    };
  }

  async logout(sessionId: string) {
    await this.prisma.session.update({
      where: { id: sessionId },
      data: { revokedAt: new Date() },
    });
  }

  async verifyEmail(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { emailVerifiedAt: new Date() },
    });
  }

  async verifyPhone(phoneE164: string, otpCode: string) {
    if (this.config.get('NODE_ENV') === 'development') {
      console.log(`[DEV] Phone verification OTP for ${phoneE164}: ${otpCode}`);
    }

    const user = await this.prisma.user.findFirst({
      where: { phoneE164 },
    });

    if (!user) {
      throw new BadRequestException('Phone number not found');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { phoneVerifiedAt: new Date() },
    });
  }

  async setupMfa(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });

    const { secret, otpauthUrl } = generateMfaSecret(user.email);

    await this.prisma.user.update({
      where: { id: userId },
      data: { mfaSecret: secret },
    });

    return { otpauthUrl };
  }

  async verifyMfa(userId: string, code: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });

    if (!user.mfaSecret) {
      throw new BadRequestException('MFA not set up. Call /auth/mfa/setup first');
    }

    const valid = verifyMfaToken(user.mfaSecret, code);
    if (!valid) {
      throw new BadRequestException('Invalid MFA code');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { mfaEnabled: true },
    });
  }

  async refreshTokens(refreshToken: string | undefined) {
    if (!refreshToken) {
      throw new UnauthorizedException('No refresh token provided');
    }

    let payload: { sub: string; sessionId: string };
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const session = await this.prisma.session.findUnique({
      where: { id: payload.sessionId },
    });

    if (!session || session.revokedAt) {
      throw new UnauthorizedException('Session has been revoked');
    }

    if (session.expiresAt < new Date()) {
      throw new UnauthorizedException('Session has expired');
    }

    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: payload.sub },
      include: { roles: { include: { role: true } } },
    });

    const newSession = await this.prisma.session.update({
      where: { id: session.id },
      data: {
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return this.generateTokenPair(user, newSession.id);
  }

  private async validateCaptcha(token?: string): Promise<void> {
    if (this.config.get('NODE_ENV') === 'development') return;
    if (!token) {
      throw new BadRequestException('Captcha token is required');
    }
    // In production, validate against captcha provider API
  }

  private async createSession(
    userId: string,
    deviceFingerprint?: string,
    ip?: string,
    userAgent?: string,
  ) {
    return this.prisma.session.create({
      data: {
        userId,
        refreshTokenHash: '',
        deviceFingerprint,
        ipAddress: ip,
        userAgent,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });
  }

  private generateTokenPair(
    user: { id: string; email: string; roles?: { role: { name: string } }[] },
    sessionId: string,
  ) {
    const roles = user.roles?.map((r) => r.role.name) ?? [];

    const jwtPayload: JwtPayload = {
      sub: user.id,
      email: user.email,
      roles,
      sessionId,
    };

    return {
      accessToken: generateAccessToken(jwtPayload),
      refreshToken: generateRefreshToken(user.id, sessionId),
    };
  }
}
