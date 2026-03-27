import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { getDefaultProvider, DEFAULT_REGISTRY } from '@pet-central/ai-core';
import {
  AIChannelType,
  DiscoveredEntityType,
  DiscoveryMethod,
  MatchStatus,
} from '@pet-central/database';

interface ScanDto {
  sourceUrl?: string;
  sourceContent?: string;
  entityType: string;
}

interface BatchSource {
  url: string;
  entityType: string;
}

interface GetEntitiesQuery {
  entityType?: string;
  matchStatus?: string;
  page: number;
  limit: number;
}

@Injectable()
export class DiscoveryService {
  private readonly logger = new Logger(DiscoveryService.name);

  constructor(private readonly prisma: PrismaService) {}

  async scan(dto: ScanDto) {
    let content = dto.sourceContent;

    if (dto.sourceUrl && !content) {
      this.logger.warn(
        `Content fetching for ${dto.sourceUrl} is stubbed — provide sourceContent directly`,
      );
      content = `[Content from ${dto.sourceUrl} would be fetched here]`;
    }

    if (!content) {
      throw new BadRequestException(
        'Either sourceUrl or sourceContent must be provided',
      );
    }

    const template = DEFAULT_REGISTRY.get('entity-scan');
    const rendered = DEFAULT_REGISTRY.render('entity-scan', {
      sourceContent: content,
      entityType: dto.entityType,
    });

    const provider = getDefaultProvider();
    const startTime = Date.now();
    const response = await provider.complete({
      systemPrompt: rendered.systemPrompt,
      messages: [{ role: 'user', content: rendered.userPrompt }],
    });
    const latencyMs = Date.now() - startTime;

    let extractedProfile: Record<string, unknown>;
    try {
      extractedProfile = JSON.parse(response.content);
    } catch {
      extractedProfile = { rawResponse: response.content };
    }

    const entity = await this.prisma.discoveredEntity.create({
      data: {
        entityType: dto.entityType as DiscoveredEntityType,
        sourceUrl: dto.sourceUrl ?? null,
        sourceName: extractedProfile.name as string ?? null,
        extractedProfileJson: extractedProfile as any,
        discoveryMethod: DiscoveryMethod.AI_SCAN,
        matchStatus: MatchStatus.NEW_MATCH,
      },
    });

    await this.prisma.aIInteraction.create({
      data: {
        channelType: AIChannelType.INTERNAL_ASSISTANT,
        promptVersion: template?.version ?? 'unknown',
        modelName: response.model,
        inputSummary: `Entity scan: ${dto.entityType} from ${dto.sourceUrl ?? 'direct content'}`,
        outputSummary: response.content.substring(0, 500),
      },
    });

    this.logger.log(
      `Entity scan completed in ${latencyMs}ms, entity=${entity.id}`,
    );

    return {
      entityId: entity.id,
      entityType: entity.entityType,
      matchStatus: entity.matchStatus,
      extractedProfile,
    };
  }

  async batchScan(sources: BatchSource[]) {
    const entities = await Promise.all(
      sources.map(async (source) => {
        const entity = await this.prisma.discoveredEntity.create({
          data: {
            entityType: source.entityType as DiscoveredEntityType,
            sourceUrl: source.url,
            discoveryMethod: DiscoveryMethod.AI_SCAN,
            matchStatus: MatchStatus.NEW_MATCH,
          },
        });

        this.logger.log(
          `Queued scan for entity=${entity.id}, url=${source.url}`,
        );

        return {
          entityId: entity.id,
          sourceUrl: source.url,
          entityType: source.entityType,
          status: 'queued',
        };
      }),
    );

    return { queued: entities.length, entities };
  }

  async getEntities(query: GetEntitiesQuery) {
    const where: any = {};

    if (query.entityType) {
      where.entityType = query.entityType as DiscoveredEntityType;
    }
    if (query.matchStatus) {
      where.matchStatus = query.matchStatus as MatchStatus;
    }

    const skip = (query.page - 1) * query.limit;

    const [entities, total] = await Promise.all([
      this.prisma.discoveredEntity.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: query.limit,
      }),
      this.prisma.discoveredEntity.count({ where }),
    ]);

    return {
      data: entities.map((e) => ({
        id: e.id,
        entityType: e.entityType,
        sourceUrl: e.sourceUrl,
        sourceName: e.sourceName,
        extractedProfile: e.extractedProfileJson as Record<string, unknown> | null,
        discoveryMethod: e.discoveryMethod,
        matchStatus: e.matchStatus,
        createdAt: e.createdAt,
      })),
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }
}
