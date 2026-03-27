import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        roles: { include: { role: true } },
        organizationMembers: {
          include: { organization: { select: { id: true, publicName: true } } },
        },
      },
    });

    if (!user) throw new NotFoundException('User not found');

    return {
      id: user.id,
      email: user.email,
      emailVerified: !!user.emailVerifiedAt,
      phoneVerified: !!user.phoneVerifiedAt,
      mfaEnabled: user.mfaEnabled,
      profile: user.profile,
      roles: user.roles.map((r) => r.role.name),
      organizations: user.organizationMembers.map((m) => ({
        orgId: m.organization.id,
        orgName: m.organization.publicName,
        role: m.membershipRole,
      })),
    };
  }

  async updateProfile(userId: string, dto: Record<string, any>) {
    const { displayName, bio, avatarUrl, phoneE164 } = dto;

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(phoneE164 !== undefined && { phoneE164 }),
        profile: {
          update: {
            ...(displayName !== undefined && { displayName }),
            ...(bio !== undefined && { bio }),
            ...(avatarUrl !== undefined && { avatarUrl }),
          },
        },
      },
      include: { profile: true },
    });

    return {
      id: user.id,
      email: user.email,
      profile: user.profile,
    };
  }

  async getFavorites(userId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [favorites, total] = await Promise.all([
      this.prisma.favorite.findMany({
        where: { userId },
        include: {
          listing: {
            include: {
              pet: { include: { media: { take: 1, orderBy: { sortOrder: 'asc' } } } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.favorite.count({ where: { userId } }),
    ]);

    return {
      items: favorites,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async addFavorite(userId: string, listingId: string) {
    const existing = await this.prisma.favorite.findFirst({
      where: { userId, listingId },
    });

    if (existing) {
      throw new ConflictException('Listing is already in favorites');
    }

    return this.prisma.favorite.create({
      data: { userId, listingId },
    });
  }

  async removeFavorite(userId: string, favoriteId: string) {
    const favorite = await this.prisma.favorite.findFirst({
      where: { id: favoriteId, userId },
    });

    if (!favorite) {
      throw new NotFoundException('Favorite not found');
    }

    await this.prisma.favorite.delete({ where: { id: favoriteId } });
  }
}
