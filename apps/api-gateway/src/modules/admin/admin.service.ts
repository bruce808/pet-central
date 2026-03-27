import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import {
  AuditActorType,
  ModerationStatus,
  UserStatus,
  CaseStatus,
  AIRunStatus,
  AIRunType,
  DiscoveredEntityType,
  MatchStatus,
  Prisma,
} from '@pet-central/database';

interface AuditLogFilters {
  actorType?: string;
  actorId?: string;
  actionType?: string;
  targetType?: string;
  targetId?: string;
  startDate?: string;
  endDate?: string;
}

interface ModerateDto {
  action: string;
  reason?: string;
}

interface UserFilters {
  status?: string;
  search?: string;
  role?: string;
}

interface CorrespondenceRunFilters {
  status?: string;
  runType?: string;
}

interface DiscoveredEntityFilters {
  entityType?: string;
  matchStatus?: string;
}

interface UpdateEntityDto {
  matchStatus: string;
  routedToTeam?: string;
}

const MODERATION_ACTION_MAP: Record<string, ModerationStatus> = {
  approve: ModerationStatus.APPROVED,
  reject: ModerationStatus.REJECTED,
  flag: ModerationStatus.FLAGGED,
  requires_review: ModerationStatus.REQUIRES_REVIEW,
};

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardStats() {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      userCount,
      orgCount,
      listingCount,
      pendingVerifications,
      openCases,
      moderationQueueSize,
      recentSignups,
      listingsByPetType,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.organization.count(),
      this.prisma.petListing.count(),
      this.prisma.organizationVerification.count({
        where: { status: 'PENDING' },
      }),
      this.prisma.case.count({
        where: {
          status: { in: [CaseStatus.NEW_CASE, CaseStatus.ASSIGNED, CaseStatus.INVESTIGATING] },
        },
      }),
      this.prisma.review.count({
        where: { moderationStatus: ModerationStatus.PENDING_MODERATION },
      }),
      this.prisma.user.count({
        where: { createdAt: { gte: sevenDaysAgo } },
      }),
      this.prisma.pet.groupBy({
        by: ['petType'],
        _count: { id: true },
        where: { listing: { isNot: null } },
      }),
    ]);

    return {
      userCount,
      orgCount,
      listingCount,
      pendingVerifications,
      openCases,
      moderationQueueSize,
      recentSignups,
      listingsByPetType: listingsByPetType.map((g) => ({
        petType: g.petType,
        count: g._count.id,
      })),
    };
  }

  async getAuditLogs(filters: AuditLogFilters, page: number, limit: number) {
    const safeLimit = Math.min(limit, 100);
    const skip = (page - 1) * safeLimit;

    const where: Prisma.AuditLogWhereInput = {};
    if (filters.actorType) where.actorType = filters.actorType as AuditActorType;
    if (filters.actorId) where.actorId = filters.actorId;
    if (filters.actionType) where.actionType = filters.actionType;
    if (filters.targetType) where.targetType = filters.targetType;
    if (filters.targetId) where.targetId = filters.targetId;
    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
      if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
    }

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: safeLimit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      data: logs,
      meta: { total, page, limit: safeLimit, totalPages: Math.ceil(total / safeLimit) },
    };
  }

  async moderateReview(reviewId: string, userId: string, dto: ModerateDto) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });
    if (!review) throw new NotFoundException('Review not found');

    const newStatus = MODERATION_ACTION_MAP[dto.action];
    if (!newStatus) throw new NotFoundException('Invalid moderation action');

    const [updated] = await this.prisma.$transaction([
      this.prisma.review.update({
        where: { id: reviewId },
        data: { moderationStatus: newStatus },
      }),
      this.prisma.auditLog.create({
        data: {
          actorType: AuditActorType.ADMIN_ACTOR,
          actorId: userId,
          actionType: `review_${dto.action}`,
          targetType: 'review',
          targetId: reviewId,
          metadataJson: { reason: dto.reason },
        },
      }),
    ]);

    return updated;
  }

  async moderateMessage(messageId: string, userId: string, dto: ModerateDto) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    });
    if (!message) throw new NotFoundException('Message not found');

    const newStatus = MODERATION_ACTION_MAP[dto.action];
    if (!newStatus) throw new NotFoundException('Invalid moderation action');

    const [updated] = await this.prisma.$transaction([
      this.prisma.message.update({
        where: { id: messageId },
        data: { moderationStatus: newStatus },
      }),
      this.prisma.auditLog.create({
        data: {
          actorType: AuditActorType.ADMIN_ACTOR,
          actorId: userId,
          actionType: `message_${dto.action}`,
          targetType: 'message',
          targetId: messageId,
          metadataJson: { reason: dto.reason },
        },
      }),
    ]);

    return updated;
  }

  async getUsers(filters: UserFilters, page: number, limit: number) {
    const safeLimit = Math.min(limit, 100);
    const skip = (page - 1) * safeLimit;

    const where: Prisma.UserWhereInput = {};
    if (filters.status) where.status = filters.status as UserStatus;
    if (filters.search) {
      where.OR = [
        { email: { contains: filters.search, mode: 'insensitive' } },
        { profile: { displayName: { contains: filters.search, mode: 'insensitive' } } },
      ];
    }
    if (filters.role) {
      where.roles = { some: { role: { name: filters.role } } };
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        include: {
          profile: true,
          roles: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: safeLimit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users,
      meta: { total, page, limit: safeLimit, totalPages: Math.ceil(total / safeLimit) },
    };
  }

  async updateUserStatus(
    targetUserId: string,
    actorUserId: string,
    dto: { status: string; reason?: string },
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: targetUserId },
    });
    if (!user) throw new NotFoundException('User not found');

    const previousStatus = user.status;

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.user.update({
        where: { id: targetUserId },
        data: { status: dto.status as UserStatus },
      });

      await tx.auditLog.create({
        data: {
          actorType: AuditActorType.ADMIN_ACTOR,
          actorId: actorUserId,
          actionType: 'user_status_change',
          targetType: 'user',
          targetId: targetUserId,
          metadataJson: {
            previousStatus,
            newStatus: dto.status,
            reason: dto.reason,
          },
        },
      });

      if (dto.status === UserStatus.SUSPENDED || dto.status === UserStatus.BANNED) {
        await tx.case.create({
          data: {
            caseType: 'COMPLAINT',
            sourceType: 'user',
            sourceId: targetUserId,
            createdByUserId: actorUserId,
          },
        });
      }

      return result;
    });

    return updated;
  }

  async getModerationQueue(
    contentType: string | undefined,
    page: number,
    limit: number,
  ) {
    const safeLimit = Math.min(limit, 100);
    const skip = (page - 1) * safeLimit;
    const items: Array<{ id: string; type: string; createdAt: Date; [key: string]: any }> = [];
    let total = 0;

    const types = contentType ? [contentType] : ['review', 'message', 'listing', 'resource'];

    if (types.includes('review')) {
      const [reviews, count] = await Promise.all([
        this.prisma.review.findMany({
          where: { moderationStatus: ModerationStatus.PENDING_MODERATION },
          orderBy: { createdAt: 'desc' },
          take: safeLimit,
        }),
        this.prisma.review.count({
          where: { moderationStatus: ModerationStatus.PENDING_MODERATION },
        }),
      ]);
      items.push(...reviews.map((r) => ({ ...r, type: 'review' })));
      total += count;
    }

    if (types.includes('message')) {
      const [messages, count] = await Promise.all([
        this.prisma.message.findMany({
          where: { moderationStatus: ModerationStatus.PENDING_MODERATION },
          orderBy: { createdAt: 'desc' },
          take: safeLimit,
        }),
        this.prisma.message.count({
          where: { moderationStatus: ModerationStatus.PENDING_MODERATION },
        }),
      ]);
      items.push(...messages.map((m) => ({ ...m, type: 'message' })));
      total += count;
    }

    if (types.includes('listing')) {
      const [listings, count] = await Promise.all([
        this.prisma.petListing.findMany({
          where: { moderationStatus: ModerationStatus.PENDING_MODERATION },
          orderBy: { createdAt: 'desc' },
          take: safeLimit,
        }),
        this.prisma.petListing.count({
          where: { moderationStatus: ModerationStatus.PENDING_MODERATION },
        }),
      ]);
      items.push(...listings.map((l) => ({ ...l, type: 'listing' })));
      total += count;
    }

    if (types.includes('resource')) {
      const [resources, count] = await Promise.all([
        this.prisma.resource.findMany({
          where: { status: 'DRAFT_RESOURCE' },
          orderBy: { createdAt: 'desc' },
          take: safeLimit,
        }),
        this.prisma.resource.count({
          where: { status: 'DRAFT_RESOURCE' },
        }),
      ]);
      items.push(...resources.map((r) => ({ ...r, type: 'resource' })));
      total += count;
    }

    items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    const paged = items.slice(skip, skip + safeLimit);

    return {
      data: paged,
      meta: { total, page, limit: safeLimit, totalPages: Math.ceil(total / safeLimit) },
    };
  }

  async getCorrespondenceRuns(
    filters: CorrespondenceRunFilters,
    page: number,
    limit: number,
  ) {
    const safeLimit = Math.min(limit, 100);
    const skip = (page - 1) * safeLimit;

    const where: Prisma.AICorrespondenceRunWhereInput = {};
    if (filters.status) where.status = filters.status as AIRunStatus;
    if (filters.runType) where.runType = filters.runType as AIRunType;

    const [runs, total] = await Promise.all([
      this.prisma.aICorrespondenceRun.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: safeLimit,
      }),
      this.prisma.aICorrespondenceRun.count({ where }),
    ]);

    return {
      data: runs,
      meta: { total, page, limit: safeLimit, totalPages: Math.ceil(total / safeLimit) },
    };
  }

  async getDiscoveredEntities(
    filters: DiscoveredEntityFilters,
    page: number,
    limit: number,
  ) {
    const safeLimit = Math.min(limit, 100);
    const skip = (page - 1) * safeLimit;

    const where: Prisma.DiscoveredEntityWhereInput = {};
    if (filters.entityType) where.entityType = filters.entityType as DiscoveredEntityType;
    if (filters.matchStatus) where.matchStatus = filters.matchStatus as MatchStatus;

    const [entities, total] = await Promise.all([
      this.prisma.discoveredEntity.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: safeLimit,
      }),
      this.prisma.discoveredEntity.count({ where }),
    ]);

    return {
      data: entities,
      meta: { total, page, limit: safeLimit, totalPages: Math.ceil(total / safeLimit) },
    };
  }

  async updateDiscoveredEntity(entityId: string, dto: UpdateEntityDto) {
    const entity = await this.prisma.discoveredEntity.findUnique({
      where: { id: entityId },
    });
    if (!entity) throw new NotFoundException('Discovered entity not found');

    return this.prisma.discoveredEntity.update({
      where: { id: entityId },
      data: {
        matchStatus: dto.matchStatus as MatchStatus,
        ...(dto.routedToTeam !== undefined && { routedToTeam: dto.routedToTeam }),
      },
    });
  }
}
