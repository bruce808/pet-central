import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../../common/prisma.service';
import {
  getDefaultProvider,
  DEFAULT_REGISTRY,
} from '@pet-central/ai-core';
import {
  AIChannelType,
  AIRunType,
  AIRunStatus,
  ListingStatus,
  ModerationStatus,
} from '@pet-central/database';

interface ChatDto {
  message: string;
  sessionId?: string;
  channelType?: string;
  channelOriginId?: string;
}

interface RecommendationsDto {
  preferences: {
    petType?: string;
    breeds?: string[];
    sizeCategory?: string;
    ageRange?: { min?: number; max?: number };
    location?: string;
    [key: string]: any;
  };
  channelOriginId?: string;
}

interface DraftCorrespondenceDto {
  relatedEntityType: string;
  relatedEntityId: string;
  runType: string;
  context?: Record<string, any>;
}

interface AutoHandleDto {
  relatedEntityType: string;
  relatedEntityId: string;
  runType: string;
}

@Injectable()
export class AIService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('ai-enrichment')
    private readonly aiEnrichmentQueue: Queue,
  ) {}

  async chat(userId: string, dto: ChatDto) {
    const sessionId =
      dto.sessionId ?? `session_${userId}_${Date.now()}`;

    const previousInteractions = dto.sessionId
      ? await this.prisma.aIInteraction.findMany({
          where: { sessionId, actorUserId: userId },
          orderBy: { createdAt: 'asc' },
          take: 20,
        })
      : [];

    const [recentListings, resources] = await Promise.all([
      this.prisma.petListing.findMany({
        where: {
          listingStatus: ListingStatus.PUBLISHED,
          moderationStatus: ModerationStatus.APPROVED,
        },
        include: { pet: true },
        orderBy: { publishedAt: 'desc' },
        take: 10,
      }),
      this.prisma.resource.findMany({
        where: { status: 'PUBLISHED_RESOURCE' },
        orderBy: { publishedAt: 'desc' },
        take: 5,
      }),
    ]);

    const ragContext = {
      previousMessages: previousInteractions.map((i) => ({
        input: i.inputSummary,
        output: i.outputSummary,
      })),
      listings: recentListings.map((l) => ({
        id: l.id,
        title: l.title,
        petType: l.pet.petType,
        breed: l.pet.breedPrimary,
        location: l.locationCity,
      })),
      resources: resources.map((r) => ({
        id: r.id,
        title: r.title,
        type: r.resourceType,
      })),
    };

    const { systemPrompt, userPrompt } = DEFAULT_REGISTRY.render('pet-guidance-chat', {
      userMessage: dto.message,
      context: JSON.stringify(ragContext),
    });

    const provider = getDefaultProvider();
    const response = await provider.complete({
      messages: [{ role: 'user', content: userPrompt }],
      systemPrompt,
    });

    const template = DEFAULT_REGISTRY.get('pet-guidance-chat');
    const interaction = await this.prisma.aIInteraction.create({
      data: {
        actorUserId: userId,
        sessionId,
        channelType: (dto.channelType as AIChannelType) ?? AIChannelType.WEB_CHAT,
        promptVersion: template?.version ?? 'unknown',
        modelName: provider.name,
        inputSummary: dto.message,
        outputSummary: response.content,
      },
    });

    return {
      sessionId,
      interactionId: interaction.id,
      response: response.content,
      sources: ragContext.listings.slice(0, 3),
    };
  }

  async getRecommendations(userId: string, dto: RecommendationsDto) {
    const where: any = {
      listingStatus: ListingStatus.PUBLISHED,
      moderationStatus: ModerationStatus.APPROVED,
    };

    if (dto.preferences.petType) {
      where.pet = { petType: dto.preferences.petType };
    }
    if (dto.preferences.sizeCategory) {
      where.pet = { ...where.pet, sizeCategory: dto.preferences.sizeCategory };
    }
    if (dto.preferences.location) {
      where.locationCity = {
        contains: dto.preferences.location,
        mode: 'insensitive',
      };
    }

    const listings = await this.prisma.petListing.findMany({
      where,
      include: {
        pet: { include: { media: { where: { isPrimary: true }, take: 1 } } },
      },
      orderBy: { publishedAt: 'desc' },
      take: 50,
    });

    const { systemPrompt, userPrompt } = DEFAULT_REGISTRY.render('recommendation', {
      preferences: JSON.stringify(dto.preferences),
      listings: JSON.stringify(
        listings.map((l) => ({
          id: l.id,
          title: l.title,
          petType: l.pet.petType,
          breed: l.pet.breedPrimary,
          size: l.pet.sizeCategory,
          location: l.locationCity,
          fee: l.feeAmount,
        })),
      ),
    });

    const provider = getDefaultProvider();
    const response = await provider.complete({
      messages: [{ role: 'user', content: userPrompt }],
      systemPrompt,
    });

    return {
      recommendations: [],
      explanation: response.content,
    };
  }

  async getSession(sessionId: string, userId: string) {
    const interactions = await this.prisma.aIInteraction.findMany({
      where: { sessionId, actorUserId: userId },
      orderBy: { createdAt: 'asc' },
    });

    if (interactions.length === 0) {
      throw new NotFoundException('Session not found');
    }

    return { sessionId, interactions };
  }

  async draftCorrespondence(userId: string, dto: DraftCorrespondenceDto) {
    const run = await this.prisma.aICorrespondenceRun.create({
      data: {
        relatedEntityType: dto.relatedEntityType,
        relatedEntityId: dto.relatedEntityId,
        runType: dto.runType as AIRunType,
        status: AIRunStatus.AI_PENDING,
        inputRefJson: dto.context ?? undefined,
      },
    });

    await this.aiEnrichmentQueue.add('draft-correspondence', {
      runId: run.id,
      userId,
      relatedEntityType: dto.relatedEntityType,
      relatedEntityId: dto.relatedEntityId,
      runType: dto.runType,
      context: dto.context,
    });

    return run;
  }

  async autoHandleCorrespondence(userId: string, dto: AutoHandleDto) {
    const run = await this.prisma.aICorrespondenceRun.create({
      data: {
        relatedEntityType: dto.relatedEntityType,
        relatedEntityId: dto.relatedEntityId,
        runType: AIRunType.AUTO_REPLY,
        status: AIRunStatus.AI_PENDING,
      },
    });

    await this.aiEnrichmentQueue.add('auto-handle-correspondence', {
      runId: run.id,
      userId,
      relatedEntityType: dto.relatedEntityType,
      relatedEntityId: dto.relatedEntityId,
      runType: dto.runType,
    });

    return run;
  }

  async getCorrespondenceRun(runId: string) {
    const run = await this.prisma.aICorrespondenceRun.findUnique({
      where: { id: runId },
    });

    if (!run) throw new NotFoundException('Correspondence run not found');

    return run;
  }
}
