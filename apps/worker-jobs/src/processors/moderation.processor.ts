import { Worker, Job } from 'bullmq';
import type Redis from 'ioredis';
import { PrismaClient } from '@pet-central/database';
import { checkForSpam } from '@pet-central/messaging';
import { assessContentRisk } from '@pet-central/trust';

const prisma = new PrismaClient();

interface ModerationJobData {
  id: string;
}

type ModerationJobName =
  | 'moderate-listing'
  | 'moderate-review'
  | 'moderate-message'
  | 'moderate-resource';

export function createModerationWorker(connection: Redis): Worker<ModerationJobData, void, ModerationJobName> {
  return new Worker<ModerationJobData, void, ModerationJobName>(
    'moderation',
    async (job: Job<ModerationJobData, void, ModerationJobName>) => {
      const { id } = job.data;

      try {
        switch (job.name) {
          case 'moderate-listing':
            await moderateListing(id);
            break;
          case 'moderate-review':
            await moderateReview(id);
            break;
          case 'moderate-message':
            await moderateMessage(id);
            break;
          case 'moderate-resource':
            await moderateResource(id);
            break;
          default:
            console.warn(`[moderation] Unknown job name: ${job.name}`);
        }
      } catch (error) {
        console.error(`[moderation] Job ${job.name} failed for ${id}:`, error);
        throw error;
      }
    },
    { connection, concurrency: 5 },
  );
}

async function moderateListing(id: string): Promise<void> {
  const listing = await prisma.petListing.findUniqueOrThrow({
    where: { id },
    include: { pet: true },
  });

  const text = `${listing.title} ${listing.pet.description ?? ''}`;
  const risk = assessContentRisk({
    contentType: 'listing',
    textLength: text.length,
    containsLinks: /https?:\/\//.test(text),
    containsContactInfo: /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/.test(text),
    similarContentCount: 0,
    accountRisk: 'low',
  });

  const moderationStatus =
    risk.overallRisk === 'high' || risk.overallRisk === 'critical'
      ? 'REQUIRES_REVIEW'
      : risk.overallRisk === 'medium'
        ? 'REQUIRES_REVIEW'
        : 'APPROVED';

  await prisma.petListing.update({
    where: { id },
    data: { moderationStatus: moderationStatus as any },
  });

  console.log(
    `[moderation] Listing ${id}: risk=${risk.overallRisk}, status=${moderationStatus}`,
  );
}

async function moderateReview(id: string): Promise<void> {
  const review = await prisma.review.findUniqueOrThrow({
    where: { id },
    include: { reviewer: true },
  });

  const text = review.reviewText ?? '';

  const spamResult = checkForSpam({
    text,
    senderAccountAgeDays: daysSince(review.reviewer.createdAt),
    messagesSentLast24h: 0,
    containsLinks: /https?:\/\//.test(text),
    containsContactInfo: /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/.test(text),
    recipientCount24h: 0,
  });

  const risk = assessContentRisk({
    contentType: 'review',
    textLength: text.length,
    containsLinks: /https?:\/\//.test(text),
    containsContactInfo: /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/.test(text),
    similarContentCount: 0,
    accountRisk: 'low',
  });

  let moderationStatus: string;
  if (spamResult.isSpam || risk.overallRisk === 'critical') {
    moderationStatus = 'REJECTED';
  } else if (risk.requiresReview || spamResult.requiresReview) {
    moderationStatus = 'REQUIRES_REVIEW';
  } else {
    moderationStatus = 'APPROVED';
  }

  await prisma.review.update({
    where: { id },
    data: { moderationStatus: moderationStatus as any },
  });

  console.log(
    `[moderation] Review ${id}: spam=${spamResult.isSpam}, risk=${risk.overallRisk}, status=${moderationStatus}`,
  );
}

async function moderateMessage(id: string): Promise<void> {
  const message = await prisma.message.findUniqueOrThrow({
    where: { id },
    include: { sender: true },
  });

  const text = message.bodyText;

  const spamResult = checkForSpam({
    text,
    senderAccountAgeDays: daysSince(message.sender.createdAt),
    messagesSentLast24h: 0,
    containsLinks: /https?:\/\//.test(text),
    containsContactInfo: /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/.test(text),
    recipientCount24h: 0,
  });

  const risk = assessContentRisk({
    contentType: 'message',
    textLength: text.length,
    containsLinks: /https?:\/\//.test(text),
    containsContactInfo: /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/.test(text),
    similarContentCount: 0,
    accountRisk: 'low',
  });

  let moderationStatus: string;
  let riskScore = spamResult.score / 100;

  if (risk.overallRisk === 'critical') {
    moderationStatus = 'FLAGGED';
    riskScore = 1.0;
  } else if (spamResult.isSpam || risk.overallRisk === 'high') {
    moderationStatus = 'REQUIRES_REVIEW';
  } else if (risk.requiresReview || spamResult.requiresReview) {
    moderationStatus = 'REQUIRES_REVIEW';
  } else {
    moderationStatus = 'APPROVED';
  }

  await prisma.message.update({
    where: { id },
    data: {
      moderationStatus: moderationStatus as any,
      riskScore,
    },
  });

  console.log(
    `[moderation] Message ${id}: spam=${spamResult.isSpam}, risk=${risk.overallRisk}, status=${moderationStatus}`,
  );
}

async function moderateResource(id: string): Promise<void> {
  const resource = await prisma.resource.findUniqueOrThrow({
    where: { id },
  });

  const text = `${resource.title} ${resource.bodyMarkdown}`;
  const risk = assessContentRisk({
    contentType: 'resource',
    textLength: text.length,
    containsLinks: /https?:\/\//.test(text),
    containsContactInfo: /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/.test(text),
    similarContentCount: 0,
    accountRisk: 'low',
  });

  const status =
    risk.overallRisk === 'high' || risk.overallRisk === 'critical'
      ? 'DRAFT_RESOURCE'
      : 'PUBLISHED_RESOURCE';

  await prisma.resource.update({
    where: { id },
    data: { status: status as any },
  });

  console.log(
    `[moderation] Resource ${id}: risk=${risk.overallRisk}, status=${status}`,
  );
}

function daysSince(date: Date): number {
  return Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
}
