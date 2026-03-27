import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

@Injectable()
export class OrganizationsService {
  constructor(private readonly prisma: PrismaService) {}

  async createOrganization(userId: string, dto: Record<string, any>) {
    const { legalName, publicName, organizationType, description, websiteUrl, phone, city, region, country } = dto;

    const org = await this.prisma.organization.create({
      data: {
        legalName: legalName ?? publicName,
        publicName: publicName ?? legalName,
        organizationType,
        description,
        websiteUrl,
        phone,
        city,
        region,
        country,
        members: {
          create: {
            userId,
            membershipRole: 'ADMIN',
          },
        },
      },
      include: {
        members: { include: { user: { select: { id: true, email: true } } } },
      },
    });

    await this.prisma.userRole.create({
      data: {
        user: { connect: { id: userId } },
        role: { connect: { name: 'vendor_admin' } },
      },
    });

    await this.prisma.organizationVerification.create({
      data: {
        organizationId: org.id,
        verificationType: 'IDENTITY',
        status: 'PENDING',
      },
    });

    return org;
  }

  async updateOrganization(
    orgId: string,
    userId: string,
    dto: Record<string, any>,
  ) {
    await this.checkOrgAccess(orgId, userId, 'admin');

    const { publicName, description, websiteUrl, phone } = dto;

    return this.prisma.organization.update({
      where: { id: orgId },
      data: {
        ...(publicName !== undefined && { publicName }),
        ...(description !== undefined && { description }),
        ...(websiteUrl !== undefined && { websiteUrl }),
        ...(phone !== undefined && { phone }),
      },
    });
  }

  async getOrganization(orgId: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id: orgId },
      include: {
        badges: true,
        _count: {
          select: {
            members: true,
          },
        },
      },
    });

    if (!org) throw new NotFoundException('Organization not found');

    return {
      ...org,
    };
  }

  async uploadDocument(
    orgId: string,
    userId: string,
    dto: Record<string, any>,
  ) {
    await this.checkOrgAccess(orgId, userId);

    const { type, url, filename: _filename } = dto;

    return this.prisma.organizationDocument.create({
      data: {
        organizationId: orgId,
        documentType: type,
        storageKey: url,
        uploadedByUserId: userId,
      },
    });
  }

  async getMembers(orgId: string) {
    return this.prisma.organizationMember.findMany({
      where: { organizationId: orgId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            profile: { select: { displayName: true, avatarUrl: true } },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async addMember(orgId: string, dto: { email: string; role: string }) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (!user) {
      throw new NotFoundException('User not found with that email');
    }

    return this.prisma.organizationMember.create({
      data: {
        organizationId: orgId,
        userId: user.id,
        membershipRole: dto.role as any,
      },
      include: {
        user: { select: { id: true, email: true } },
      },
    });
  }

  async removeMember(orgId: string, memberId: string) {
    const membership = await this.prisma.organizationMember.findFirst({
      where: { id: memberId, organizationId: orgId },
    });

    if (!membership) {
      throw new NotFoundException('Member not found in this organization');
    }

    await this.prisma.organizationMember.delete({ where: { id: memberId } });
  }

  async checkOrgAccess(orgId: string, userId: string, requiredRole?: string) {
    const membership = await this.prisma.organizationMember.findFirst({
      where: { organizationId: orgId, userId },
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this organization');
    }

    if (requiredRole && membership.membershipRole !== requiredRole) {
      throw new ForbiddenException(
        `Requires ${requiredRole} role in this organization`,
      );
    }

    return membership;
  }
}
