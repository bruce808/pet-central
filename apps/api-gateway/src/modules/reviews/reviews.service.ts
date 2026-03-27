import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../../common/prisma.service';
import { ModerationStatus } from '@pet-central/database';

const EDIT_WINDOW_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class ReviewsService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('moderation') private readonly moderationQueue: Queue,
  ) {}

  async createReview(userId: string, dto: Record<string, any>) {
    await this.checkReviewEligibility(userId, dto.subjectType, dto.subjectId);

    const existingReview = await this.prisma.review.findFirst({
      where: {
        reviewerUserId: userId,
        subjectType: dto.subjectType,
        subjectId: dto.subjectId,
      },
    });

    if (existingReview) {
      throw new ConflictException(
        'You have already reviewed this subject',
      );
    }

    const review = await this.prisma.review.create({
      data: {
        reviewerUserId: userId,
        reviewerActorType: 'USER_REVIEWER',
        subjectType: dto.subjectType,
        subjectId: dto.subjectId,
        interactionId: dto.interactionId,
        ratingOverall: dto.ratingOverall,
        ratingDimensionsJson: dto.ratingDimensions,
        reviewText: dto.reviewText,
        visibilityScope: dto.visibilityScope ?? 'PUBLIC',
        moderationStatus: ModerationStatus.PENDING_MODERATION,
      },
    });

    await this.moderationQueue.add('moderate-listing', {
      listingId: review.id,
      contentType: 'review',
    });

    return review;
  }

  async updateReview(
    reviewId: string,
    userId: string,
    dto: Record<string, any>,
  ) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) throw new NotFoundException('Review not found');

    if (review.reviewerUserId !== userId) {
      throw new ForbiddenException('You can only edit your own reviews');
    }

    const elapsed = Date.now() - review.createdAt.getTime();
    if (elapsed > EDIT_WINDOW_MS) {
      throw new BadRequestException(
        'Reviews can only be edited within 24 hours of creation',
      );
    }

    const updated = await this.prisma.review.update({
      where: { id: reviewId },
      data: {
        ...(dto.ratingOverall !== undefined && { ratingOverall: dto.ratingOverall }),
        ...(dto.ratingDimensions !== undefined && { ratingDimensionsJson: dto.ratingDimensions }),
        ...(dto.reviewText !== undefined && { reviewText: dto.reviewText }),
        ...(dto.visibilityScope !== undefined && { visibilityScope: dto.visibilityScope }),
        moderationStatus: ModerationStatus.PENDING_MODERATION,
      },
    });

    await this.moderationQueue.add('moderate-listing', {
      listingId: reviewId,
      contentType: 'review',
    });

    return updated;
  }

  async respondToReview(
    reviewId: string,
    userId: string,
    dto: { responseText: string },
  ) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) throw new NotFoundException('Review not found');

    if (review.subjectType !== 'ORGANIZATION_SUBJECT') {
      throw new BadRequestException(
        'Responses are only supported for organization reviews',
      );
    }

    const membership = await this.prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId: review.subjectId,
          userId,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException(
        'You must be a member of the reviewed organization to respond',
      );
    }

    return this.prisma.reviewResponse.create({
      data: {
        reviewId,
        responderUserId: userId,
        responseText: dto.responseText,
      },
    });
  }

  async flagReview(
    reviewId: string,
    userId: string,
    dto: { reasonCode: string; notes?: string },
  ) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) throw new NotFoundException('Review not found');

    const flag = await this.prisma.reviewFlag.create({
      data: {
        reviewId,
        flaggedByUserId: userId,
        reasonCode: dto.reasonCode,
        notes: dto.notes,
      },
    });

    const flagCount = await this.prisma.reviewFlag.count({
      where: { reviewId },
    });

    if (flagCount >= 3) {
      await this.prisma.review.update({
        where: { id: reviewId },
        data: { moderationStatus: ModerationStatus.REQUIRES_REVIEW },
      });
    }

    return flag;
  }

  async getOrganizationReviews(orgId: string, page: number, limit: number) {
    const safeLimit = Math.min(limit || 20, 100);
    const safePage = page || 1;
    const skip = (safePage - 1) * safeLimit;

    const where = {
      subjectType: 'ORGANIZATION_SUBJECT' as const,
      subjectId: orgId,
      moderationStatus: ModerationStatus.APPROVED,
      visibilityScope: 'PUBLIC' as const,
    };

    const [reviews, total, aggregation] = await Promise.all([
      this.prisma.review.findMany({
        where,
        include: {
          reviewer: {
            select: {
              id: true,
              profile: {
                select: { displayName: true, avatarUrl: true },
              },
            },
          },
          responses: {
            orderBy: { createdAt: 'asc' },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: safeLimit,
      }),
      this.prisma.review.count({ where }),
      this.prisma.review.aggregate({
        where,
        _avg: { ratingOverall: true },
        _count: { id: true },
      }),
    ]);

    return {
      data: reviews,
      meta: {
        total,
        page: safePage,
        limit: safeLimit,
        totalPages: Math.ceil(total / safeLimit),
        averageRating: aggregation._avg.ratingOverall,
      },
    };
  }

  async checkReviewEligibility(
    userId: string,
    subjectType: string,
    subjectId: string,
  ) {
    if (subjectType === 'ORGANIZATION_SUBJECT') {
      const interaction = await this.prisma.interaction.findFirst({
        where: {
          userId,
          organizationId: subjectId,
        },
      });

      if (!interaction) {
        throw new BadRequestException(
          'You must have interacted with this organization before leaving a review',
        );
      }
    } else if (subjectType === 'USER_SUBJECT') {
      const interaction = await this.prisma.interaction.findFirst({
        where: {
          OR: [
            { userId, organization: { members: { some: { userId: subjectId } } } },
            { userId: subjectId, organization: { members: { some: { userId } } } },
          ],
        },
      });

      if (!interaction) {
        throw new BadRequestException(
          'You must have an interaction with this user before leaving a review',
        );
      }
    }
  }
}
