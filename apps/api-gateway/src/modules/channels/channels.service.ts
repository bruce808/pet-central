import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { resolveChannelOrigin as resolveOriginFromPartnerRouting } from '@pet-central/partner-routing';
import { ChannelType, ReferralType } from '@pet-central/database';

interface ResolveOriginDto {
  channelType: string;
  originPartnerOrgId?: string;
  originDomain?: string;
  originLocationName?: string;
  originLocationAddress?: string;
}

interface CreateReferralDto {
  channelOriginId: string;
  referralType: string;
  referredPartnerOrgId: string;
  relatedListingId?: string;
  userId?: string;
  organizationId?: string;
}

interface CreateChannelOriginDto {
  channelType: string;
  originPartnerOrgId?: string;
  originDomain?: string;
  originLocationName?: string;
  originLocationAddress?: string;
  attributionRulesJson?: Record<string, any>;
}

@Injectable()
export class ChannelsService {
  constructor(private readonly prisma: PrismaService) {}

  async resolveOrigin(dto: ResolveOriginDto) {
    const resolved = resolveOriginFromPartnerRouting({
      referrer: dto.originDomain,
      partnerToken: dto.originPartnerOrgId,
    });

    const existing = await this.prisma.channelOrigin.findFirst({
      where: {
        channelType: dto.channelType as ChannelType,
        ...(dto.originPartnerOrgId && {
          originPartnerOrgId: dto.originPartnerOrgId,
        }),
        ...(dto.originDomain && { originDomain: dto.originDomain }),
      },
      include: { originPartnerOrg: true },
    });

    if (existing) return existing;

    return this.prisma.channelOrigin.create({
      data: {
        channelType: dto.channelType as ChannelType,
        originPartnerOrgId: resolved?.partnerOrgId ?? dto.originPartnerOrgId,
        originDomain: resolved?.domain ?? dto.originDomain,
        originLocationName: dto.originLocationName,
        originLocationAddress: dto.originLocationAddress,
      },
      include: { originPartnerOrg: true },
    });
  }

  async getChannelOrigin(id: string) {
    const origin = await this.prisma.channelOrigin.findUnique({
      where: { id },
      include: { originPartnerOrg: true },
    });

    if (!origin) throw new NotFoundException('Channel origin not found');

    return origin;
  }

  async createReferral(userId: string, dto: CreateReferralDto) {
    return this.prisma.partnerReferral.create({
      data: {
        channelOriginId: dto.channelOriginId,
        referralType: dto.referralType as ReferralType,
        referredPartnerOrgId: dto.referredPartnerOrgId,
        relatedListingId: dto.relatedListingId,
        userId: dto.userId ?? userId,
        organizationId: dto.organizationId,
      },
    });
  }

  async listChannelOrigins(page: number, limit: number) {
    const safeLimit = Math.min(limit, 100);
    const skip = (page - 1) * safeLimit;

    const [origins, total] = await Promise.all([
      this.prisma.channelOrigin.findMany({
        include: { originPartnerOrg: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: safeLimit,
      }),
      this.prisma.channelOrigin.count(),
    ]);

    return {
      data: origins,
      meta: {
        total,
        page,
        limit: safeLimit,
        totalPages: Math.ceil(total / safeLimit),
      },
    };
  }

  async createChannelOrigin(dto: CreateChannelOriginDto) {
    return this.prisma.channelOrigin.create({
      data: {
        channelType: dto.channelType as ChannelType,
        originPartnerOrgId: dto.originPartnerOrgId,
        originDomain: dto.originDomain,
        originLocationName: dto.originLocationName,
        originLocationAddress: dto.originLocationAddress,
        attributionRulesJson: dto.attributionRulesJson ?? undefined,
      },
      include: { originPartnerOrg: true },
    });
  }
}
