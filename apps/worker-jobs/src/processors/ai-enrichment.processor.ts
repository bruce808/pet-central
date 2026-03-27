import { Worker, Job } from 'bullmq';
import type Redis from 'ioredis';
import { PrismaClient } from '@pet-central/database';
import {
  getDefaultProvider,
  DEFAULT_REGISTRY,
  createInteractionLog,
} from '@pet-central/ai-core';

const prisma = new PrismaClient();

interface AIEnrichmentJobData {
  id: string;
  [key: string]: unknown;
}

type AIEnrichmentJobName =
  | 'correspondence-draft'
  | 'correspondence-auto-reply'
  | 'entity-scan'
  | 'moderation-ai';

export function createAIEnrichmentWorker(connection: Redis): Worker<AIEnrichmentJobData, void, AIEnrichmentJobName> {
  return new Worker<AIEnrichmentJobData, void, AIEnrichmentJobName>(
    'ai-enrichment',
    async (job: Job<AIEnrichmentJobData, void, AIEnrichmentJobName>) => {
      const { id } = job.data;

      try {
        switch (job.name) {
          case 'correspondence-draft':
            await handleCorrespondenceDraft(id);
            break;
          case 'correspondence-auto-reply':
            await handleCorrespondenceAutoReply(id);
            break;
          case 'entity-scan':
            await handleEntityScan(id);
            break;
          case 'moderation-ai':
            await handleModerationAI(id);
            break;
          default:
            console.warn(`[ai-enrichment] Unknown job name: ${job.name}`);
        }
      } catch (error) {
        console.error(`[ai-enrichment] Job ${job.name} failed for ${id}:`, error);
        throw error;
      }
    },
    { connection, concurrency: 2 },
  );
}

async function handleCorrespondenceDraft(id: string): Promise<void> {
  const run = await prisma.aICorrespondenceRun.update({
    where: { id },
    data: { status: 'RUNNING' },
  });

  const startTime = Date.now();
  let success = false;
  let errorMsg: string | undefined;

  try {
    const provider = getDefaultProvider();
    const { systemPrompt, userPrompt } = DEFAULT_REGISTRY.render(
      'correspondence-draft',
      {
        entityType: run.relatedEntityType,
        entityId: run.relatedEntityId,
        context: JSON.stringify(run.inputRefJson ?? {}),
      },
    );

    const response = await provider.complete({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    });

    await prisma.aICorrespondenceRun.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        outputRefJson: { draft: response.content },
        confidenceScore: 0.8,
        completedAt: new Date(),
      },
    });

    success = true;
    const log = createInteractionLog({
      promptVersion: 'correspondence-draft@latest',
      modelName: response.model,
      providerName: provider.name,
      inputSummary: `Draft for ${run.relatedEntityType}:${run.relatedEntityId}`,
      outputSummary: response.content.substring(0, 200),
      tokensUsed: response.promptTokens + response.completionTokens,
      latencyMs: Date.now() - startTime,
      success: true,
    });
    console.log('[ai-enrichment] Correspondence draft completed:', log);
  } catch (error) {
    errorMsg = error instanceof Error ? error.message : String(error);
    await prisma.aICorrespondenceRun.update({
      where: { id },
      data: { status: 'FAILED' },
    });
    throw error;
  } finally {
    if (!success) {
      console.error(`[ai-enrichment] correspondence-draft failed for ${id}:`, errorMsg);
    }
  }
}

async function handleCorrespondenceAutoReply(id: string): Promise<void> {
  const run = await prisma.aICorrespondenceRun.update({
    where: { id },
    data: { status: 'RUNNING' },
  });

  const startTime = Date.now();

  try {
    const provider = getDefaultProvider();
    const { systemPrompt, userPrompt } = DEFAULT_REGISTRY.render(
      'correspondence-auto-reply',
      {
        entityType: run.relatedEntityType,
        entityId: run.relatedEntityId,
        context: JSON.stringify(run.inputRefJson ?? {}),
      },
    );

    const response = await provider.complete({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3,
    });

    const confidenceScore = 0.9;

    await prisma.aICorrespondenceRun.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        outputRefJson: { reply: response.content },
        confidenceScore,
        completedAt: new Date(),
      },
    });

    const log = createInteractionLog({
      promptVersion: 'correspondence-auto-reply@latest',
      modelName: response.model,
      providerName: provider.name,
      inputSummary: `Auto-reply for ${run.relatedEntityType}:${run.relatedEntityId}`,
      outputSummary: response.content.substring(0, 200),
      tokensUsed: response.promptTokens + response.completionTokens,
      latencyMs: Date.now() - startTime,
      success: true,
    });
    console.log('[ai-enrichment] Auto-reply completed:', log);
  } catch (error) {
    await prisma.aICorrespondenceRun.update({
      where: { id },
      data: { status: 'FAILED' },
    });
    throw error;
  }
}

async function handleEntityScan(id: string): Promise<void> {
  const startTime = Date.now();

  try {
    const entity = await prisma.discoveredEntity.findUniqueOrThrow({
      where: { id },
    });

    const provider = getDefaultProvider();
    const { systemPrompt, userPrompt } = DEFAULT_REGISTRY.render(
      'entity-scan',
      {
        entityType: entity.entityType,
        sourceUrl: entity.sourceUrl ?? '',
        sourceName: entity.sourceName ?? '',
        existingProfile: JSON.stringify(entity.extractedProfileJson ?? {}),
      },
    );

    const response = await provider.complete({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    });

    let extractedProfile: unknown;
    try {
      extractedProfile = JSON.parse(response.content);
    } catch {
      extractedProfile = { rawOutput: response.content };
    }

    await prisma.discoveredEntity.update({
      where: { id },
      data: { extractedProfileJson: extractedProfile as any },
    });

    const log = createInteractionLog({
      promptVersion: 'entity-scan@latest',
      modelName: response.model,
      providerName: provider.name,
      inputSummary: `Entity scan for ${entity.entityType}:${id}`,
      outputSummary: response.content.substring(0, 200),
      tokensUsed: response.promptTokens + response.completionTokens,
      latencyMs: Date.now() - startTime,
      success: true,
    });
    console.log('[ai-enrichment] Entity scan completed:', log);
  } catch (error) {
    console.error(`[ai-enrichment] entity-scan failed for ${id}:`, error);
    throw error;
  }
}

async function handleModerationAI(id: string): Promise<void> {
  const startTime = Date.now();

  try {
    const provider = getDefaultProvider();
    const { systemPrompt, userPrompt } = DEFAULT_REGISTRY.render(
      'moderation-review',
      { contentId: id },
    );

    const response = await provider.complete({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.1,
    });

    let decision: { action: string; confidence: number };
    try {
      decision = JSON.parse(response.content);
    } catch {
      decision = { action: 'REQUIRES_REVIEW', confidence: 0 };
    }

    console.log(
      `[ai-enrichment] AI moderation for ${id}: action=${decision.action}, confidence=${decision.confidence}`,
    );

    const log = createInteractionLog({
      promptVersion: 'moderation-review@latest',
      modelName: response.model,
      providerName: provider.name,
      inputSummary: `AI moderation for content ${id}`,
      outputSummary: JSON.stringify(decision),
      tokensUsed: response.promptTokens + response.completionTokens,
      latencyMs: Date.now() - startTime,
      success: true,
    });
    console.log('[ai-enrichment] AI moderation completed:', log);
  } catch (error) {
    console.error(`[ai-enrichment] moderation-ai failed for ${id}:`, error);
    throw error;
  }
}
