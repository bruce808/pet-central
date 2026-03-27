import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import {
  getDefaultProvider,
  DEFAULT_REGISTRY,
} from '@pet-central/ai-core';
import {
  AIChannelType,
  ListingStatus,
  ModerationStatus,
  ResourceStatus,
} from '@pet-central/database';

interface ChatDto {
  message: string;
  sessionId?: string;
  context?: { petType?: string; breed?: string; location?: string };
}

@Injectable()
export class GuidanceService {
  private readonly logger = new Logger(GuidanceService.name);

  constructor(private readonly prisma: PrismaService) {}

  async chat(dto: ChatDto) {
    const sessionId = dto.sessionId ?? `guidance_${Date.now()}`;

    const previousInteractions = dto.sessionId
      ? await this.prisma.aIInteraction.findMany({
          where: { sessionId },
          orderBy: { createdAt: 'asc' },
          take: 20,
        })
      : [];

    const resourceWhere: any = {
      status: ResourceStatus.PUBLISHED_RESOURCE,
    };

    const listingWhere: any = {
      listingStatus: ListingStatus.PUBLISHED,
      moderationStatus: ModerationStatus.APPROVED,
    };

    if (dto.context?.petType) {
      listingWhere.pet = { petType: dto.context.petType };
    }
    if (dto.context?.location) {
      listingWhere.locationCity = {
        contains: dto.context.location,
        mode: 'insensitive',
      };
    }

    const [resources, listings] = await Promise.all([
      this.prisma.resource.findMany({
        where: resourceWhere,
        orderBy: { publishedAt: 'desc' },
        take: 5,
      }),
      this.prisma.petListing.findMany({
        where: listingWhere,
        include: { pet: true },
        orderBy: { publishedAt: 'desc' },
        take: 10,
      }),
    ]);

    const ragContext = {
      previousMessages: previousInteractions.map((i) => ({
        input: i.inputSummary,
        output: i.outputSummary,
      })),
      resources: resources.map((r) => ({
        id: r.id,
        title: r.title,
        type: r.resourceType,
      })),
      listings: listings.map((l) => ({
        id: l.id,
        title: l.title,
        petType: l.pet.petType,
        breed: l.pet.breedPrimary,
        location: l.locationCity,
      })),
    };

    const template = DEFAULT_REGISTRY.get('pet-guidance-chat');
    const rendered = DEFAULT_REGISTRY.render('pet-guidance-chat', {
      userMessage: dto.message,
      context: JSON.stringify(ragContext),
    });

    const provider = getDefaultProvider();
    const startTime = Date.now();
    const response = await provider.complete({
      systemPrompt: rendered.systemPrompt,
      messages: [{ role: 'user', content: rendered.userPrompt }],
    });
    const latencyMs = Date.now() - startTime;

    const interaction = await this.prisma.aIInteraction.create({
      data: {
        sessionId,
        channelType: AIChannelType.WEB_CHAT,
        promptVersion: template?.version ?? 'unknown',
        modelName: response.model,
        inputSummary: dto.message,
        outputSummary: response.content,
      },
    });

    this.logger.log(
      `Guidance chat completed in ${latencyMs}ms, interaction=${interaction.id}`,
    );

    return {
      sessionId,
      interactionId: interaction.id,
      response: response.content,
      sources: [
        ...ragContext.resources.slice(0, 3).map((r) => ({
          type: 'resource',
          id: r.id,
          title: r.title,
        })),
        ...ragContext.listings.slice(0, 3).map((l) => ({
          type: 'listing',
          id: l.id,
          title: l.title,
        })),
      ],
    };
  }

  async explainBreed(petType: string, breed: string) {
    const provider = getDefaultProvider();
    const systemPrompt =
      'You are an expert veterinarian and animal behaviorist. Provide accurate, structured information about pet breeds and species.';
    const userPrompt = `Explain the ${breed} breed/species of ${petType}. Include the following in a structured JSON response:
- temperament: array of temperament traits
- careNeeds: object with exercise, grooming, diet, specialConsiderations
- commonHealthIssues: array of common health conditions
- sizeRange: object with weightMin, weightMax (lbs), heightMin, heightMax (inches)
- lifespan: object with min, max (years)
- suitability: object with apartments, families, firstTimeOwners, activeLifestyles (boolean)

Respond ONLY with valid JSON.`;

    const startTime = Date.now();
    const response = await provider.complete({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    });
    const latencyMs = Date.now() - startTime;

    await this.prisma.aIInteraction.create({
      data: {
        channelType: AIChannelType.WEB_CHAT,
        promptVersion: 'breed-explain-v1',
        modelName: response.model,
        inputSummary: `Breed explanation: ${petType} - ${breed}`,
        outputSummary: response.content.substring(0, 500),
      },
    });

    this.logger.log(
      `Breed explanation for ${petType}/${breed} completed in ${latencyMs}ms`,
    );

    try {
      return {
        petType,
        breed,
        info: JSON.parse(response.content),
      };
    } catch {
      return {
        petType,
        breed,
        info: response.content,
      };
    }
  }
}
