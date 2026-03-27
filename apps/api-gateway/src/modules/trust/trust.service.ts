import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import {
  VerificationStatus,
  ModerationStatus,
  AuditActorType,
} from '@pet-central/database';
import { calculateTrustScore, getTrustTier } from '@pet-central/trust';

interface VerificationDecisionDto {
  orgId: string;
  verificationId: string;
  status: string;
  notesInternal?: string;
}

@Injectable()
export class TrustService {
  constructor(private readonly prisma: PrismaService) {}

  async assignBadge(
    orgId: string,
    userId: string,
    badgeCode: string,
    expiresAt?: Date,
  ) {
    const badge = await this.prisma.trustBadge.findUnique({
      where: { code: badgeCode },
    });
    if (!badge) throw new NotFoundException(`Badge code "${badgeCode}" not found`);

    const orgBadge = await this.prisma.organizationBadge.create({
      data: {
        organizationId: orgId,
        badgeId: badge.id,
        assignedByUserId: userId,
        expiresAt,
      },
      include: { badge: true },
    });

    await this.prisma.auditLog.create({
      data: {
        actorType: AuditActorType.USER_ACTOR,
        actorId: userId,
        actionType: 'badge_assigned',
        targetType: 'organization',
        targetId: orgId,
        metadataJson: { badgeCode, badgeId: badge.id, expiresAt },
      },
    });

    return orgBadge;
  }

  async removeBadge(orgId: string, badgeId: string, userId: string) {
    const orgBadge = await this.prisma.organizationBadge.findFirst({
      where: { id: badgeId, organizationId: orgId },
    });
    if (!orgBadge) throw new NotFoundException('Badge assignment not found');

    await this.prisma.organizationBadge.delete({
      where: { id: badgeId },
    });

    await this.prisma.auditLog.create({
      data: {
        actorType: AuditActorType.USER_ACTOR,
        actorId: userId,
        actionType: 'badge_removed',
        targetType: 'organization',
        targetId: orgId,
        metadataJson: { badgeId: orgBadge.badgeId },
      },
    });

    return { message: 'Badge removed' };
  }

  async makeVerificationDecision(userId: string, dto: VerificationDecisionDto) {
    const verification =
      await this.prisma.organizationVerification.findUnique({
        where: { id: dto.verificationId },
      });
    if (!verification) throw new NotFoundException('Verification not found');

    const newStatus = dto.status as VerificationStatus;

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.organizationVerification.update({
        where: { id: dto.verificationId },
        data: {
          status: newStatus,
          reviewedAt: new Date(),
          reviewedByUserId: userId,
          notesInternal: dto.notesInternal,
        },
      });

      if (newStatus === VerificationStatus.APPROVED) {
        await tx.organization.update({
          where: { id: dto.orgId },
          data: { status: 'ACTIVE' },
        });
      }

      const activeCases = await tx.case.findMany({
        where: {
          sourceType: 'organization_verification',
          sourceId: dto.verificationId,
          status: { notIn: ['RESOLVED', 'CLOSED'] },
        },
        select: { id: true },
      });

      for (const c of activeCases) {
        await tx.caseEvent.create({
          data: {
            caseId: c.id,
            eventType: 'verification_decision',
            actorUserId: userId,
            payloadJson: {
              verificationId: dto.verificationId,
              decision: dto.status,
            },
          },
        });
      }

      return result;
    });

    await this.prisma.auditLog.create({
      data: {
        actorType: AuditActorType.USER_ACTOR,
        actorId: userId,
        actionType: 'verification_decision',
        targetType: 'organization_verification',
        targetId: dto.verificationId,
        metadataJson: {
          orgId: dto.orgId,
          previousStatus: verification.status,
          newStatus: dto.status,
        },
      },
    });

    return updated;
  }

  async getTrustProfile(orgId: string) {
    const [org, badges, verifications, reviewStats, complaints, interactions] =
      await Promise.all([
        this.prisma.organization.findUniqueOrThrow({
          where: { id: orgId },
          select: {
            id: true,
            publicName: true,
            status: true,
            createdAt: true,
          },
        }),
        this.prisma.organizationBadge.findMany({
          where: { organizationId: orgId },
          include: { badge: true },
        }),
        this.prisma.organizationVerification.findMany({
          where: { organizationId: orgId },
          orderBy: { submittedAt: 'desc' },
        }),
        this.prisma.review.aggregate({
          where: {
            subjectType: 'ORGANIZATION_SUBJECT',
            subjectId: orgId,
            moderationStatus: ModerationStatus.APPROVED,
          },
          _avg: { ratingOverall: true },
          _count: { id: true },
        }),
        this.prisma.case.count({
          where: {
            caseType: 'COMPLAINT',
            sourceType: 'organization',
            sourceId: orgId,
          },
        }),
        this.prisma.interaction.findMany({
          where: { organizationId: orgId },
          select: { verificationLevel: true },
        }),
      ]);

    const totalInteractions = interactions.length;
    const verifiedInteractions = interactions.filter(
      (i) => i.verificationLevel > 0,
    ).length;
    const accountAgeDays = Math.floor(
      (Date.now() - org.createdAt.getTime()) / (1000 * 60 * 60 * 24),
    );
    const hasApprovedVerification = verifications.some(
      (v) => v.status === VerificationStatus.APPROVED,
    );

    const trustScore = calculateTrustScore({
      averageRating: reviewStats._avg.ratingOverall ?? 0,
      totalReviews: reviewStats._count.id,
      verifiedInteractionRatio:
        totalInteractions > 0 ? verifiedInteractions / totalInteractions : 0,
      recencyWeight: 1,
      complaintCount: complaints,
      complaintPenalty: 5,
      verificationMultiplier: hasApprovedVerification ? 1.2 : 1,
      responseRate: 0,
      listingCompleteness: 0,
      accountAgeDays,
    });

    return {
      organization: org,
      trustScore,
      trustTier: getTrustTier(trustScore),
      badges,
      verifications,
      reviewStats: {
        averageRating: reviewStats._avg.ratingOverall,
        totalReviews: reviewStats._count.id,
      },
      complaintCount: complaints,
    };
  }

  async getPublicBadges(orgId: string) {
    return this.prisma.organizationBadge.findMany({
      where: {
        organizationId: orgId,
        badge: { publicVisibility: 'PUBLIC_BADGE' },
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      include: {
        badge: {
          select: { code: true, label: true, description: true },
        },
      },
    });
  }
}
