import { Worker, Job } from 'bullmq';
import type Redis from 'ioredis';
import { PrismaClient } from '@pet-central/database';
import {
  calculateTrustScore,
  checkBadgeEligibility,
  assessAccountRisk,
  type TrustScoreInputs,
} from '@pet-central/trust';

const prisma = new PrismaClient();

interface TrustScoringJobData {
  id: string;
}

type TrustScoringJobName = 'recalculate-org-trust' | 'recalculate-user-risk';

export function createTrustScoringWorker(connection: Redis): Worker<TrustScoringJobData, void, TrustScoringJobName> {
  return new Worker<TrustScoringJobData, void, TrustScoringJobName>(
    'trust-scoring',
    async (job: Job<TrustScoringJobData, void, TrustScoringJobName>) => {
      const { id } = job.data;

      try {
        switch (job.name) {
          case 'recalculate-org-trust':
            await recalculateOrgTrust(id);
            break;
          case 'recalculate-user-risk':
            await recalculateUserRisk(id);
            break;
          default:
            console.warn(`[trust-scoring] Unknown job name: ${job.name}`);
        }
      } catch (error) {
        console.error(`[trust-scoring] Job ${job.name} failed for ${id}:`, error);
        throw error;
      }
    },
    { connection, concurrency: 3 },
  );
}

async function recalculateOrgTrust(orgId: string): Promise<void> {
  const org = await prisma.organization.findUniqueOrThrow({
    where: { id: orgId },
    include: {
      verifications: { where: { status: 'APPROVED' }, take: 1 },
      badges: true,
      members: {
        where: { membershipRole: 'ADMIN' },
        take: 1,
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  const reviews = await prisma.review.findMany({
    where: {
      subjectType: 'ORGANIZATION_SUBJECT',
      subjectId: orgId,
      moderationStatus: 'APPROVED',
    },
    select: { ratingOverall: true, createdAt: true },
  });

  const totalReviews = reviews.length;
  const averageRating =
    totalReviews > 0
      ? reviews.reduce((sum, r) => sum + r.ratingOverall, 0) / totalReviews
      : 0;

  const interactions = await prisma.interaction.count({
    where: {
      listing: { pet: { organizationId: orgId } },
    },
  });

  const verifiedInteractions = await prisma.interaction.count({
    where: {
      listing: { pet: { organizationId: orgId } },
      verificationLevel: { gt: 0 },
    },
  });

  const complaints = await prisma.reviewFlag.count({
    where: {
      review: {
        subjectType: 'ORGANIZATION_SUBJECT',
        subjectId: orgId,
      },
    },
  });

  const isVerified = org.verifications.length > 0;
  const accountAgeDays = Math.floor(
    (Date.now() - org.createdAt.getTime()) / (1000 * 60 * 60 * 24),
  );

  const inputs: TrustScoreInputs = {
    averageRating,
    totalReviews,
    verifiedInteractionRatio:
      interactions > 0 ? verifiedInteractions / interactions : 0,
    recencyWeight: calculateRecencyWeight(reviews.map((r) => r.createdAt)),
    complaintCount: complaints,
    complaintPenalty: 0.1,
    verificationMultiplier: isVerified ? 1.0 : 0.5,
    responseRate: 0.8,
    listingCompleteness: 0.9,
    accountAgeDays,
  };

  const score = calculateTrustScore(inputs);

  await prisma.petListing.updateMany({
    where: {
      pet: { organizationId: orgId },
      listingStatus: 'PUBLISHED',
    },
    data: { trustRankSnapshot: score },
  });

  const badgeCodes = ['verified', 'top_rated', 'responsive', 'established', 'trusted', 'complaint_free'];
  const orgMetrics = {
    verificationStatus: isVerified ? 'verified' : 'unverified',
    averageRating,
    totalReviews,
    responseRate: inputs.responseRate,
    accountAgeDays,
    complaintCount: complaints,
  };

  const assignedByUserId = org.members[0]?.userId;
  if (!assignedByUserId) {
    console.warn(`[trust-scoring] Org ${orgId} has no admin member, skipping badge assignment`);
  }

  for (const code of badgeCodes) {
    const eligibility = checkBadgeEligibility(code, orgMetrics);
    if (eligibility.eligible && assignedByUserId) {
      const badge = await prisma.trustBadge.findFirst({ where: { code } });
      if (badge) {
        await prisma.organizationBadge.upsert({
          where: {
            organizationId_badgeId: {
              organizationId: orgId,
              badgeId: badge.id,
            },
          },
          create: {
            organizationId: orgId,
            badgeId: badge.id,
            assignedByUserId,
          },
          update: {},
        });
      }
    }
  }

  console.log(
    `[trust-scoring] Org ${orgId}: score=${score}, reviews=${totalReviews}, complaints=${complaints}`,
  );
}

async function recalculateUserRisk(userId: string): Promise<void> {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
  });

  const accountAgeDays = Math.floor(
    (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24),
  );

  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const messageCount24h = await prisma.message.count({
    where: { senderUserId: userId, createdAt: { gte: oneDayAgo } },
  });

  const reviewCount24h = await prisma.review.count({
    where: { reviewerUserId: userId, createdAt: { gte: oneDayAgo } },
  });

  const reportCount = await prisma.reviewFlag.count({
    where: {
      review: { reviewerUserId: userId },
    },
  });

  const assessment = assessAccountRisk({
    accountAgeDays,
    messageCount24h,
    reviewCount24h,
    reportCount,
    deviceFingerprints: 1,
    ipRiskScore: 0,
  });

  const riskLevelMap: Record<string, string> = {
    low: 'LOW_RISK',
    medium: 'MEDIUM_RISK',
    high: 'HIGH_RISK',
    critical: 'CRITICAL_RISK',
  };

  const riskLevel = riskLevelMap[assessment.overallRisk] ?? 'LOW_RISK';

  await prisma.user.update({
    where: { id: userId },
    data: { riskLevel: riskLevel as any },
  });

  console.log(
    `[trust-scoring] User ${userId}: risk=${assessment.overallRisk}, action=${assessment.recommendedAction}`,
  );
}

function calculateRecencyWeight(dates: Date[]): number {
  if (dates.length === 0) return 0;

  const now = Date.now();
  const ninetyDaysMs = 90 * 24 * 60 * 60 * 1000;
  const recentCount = dates.filter((d) => now - d.getTime() < ninetyDaysMs).length;

  return recentCount / dates.length;
}
