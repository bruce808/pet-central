import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { getDefaultProvider, DEFAULT_REGISTRY } from '@pet-central/ai-core';
import {
  AIChannelType,
  ListingStatus,
  ModerationStatus,
} from '@pet-central/database';

interface Preferences {
  petType?: string;
  breeds?: string[];
  size?: string;
  temperament?: string[];
  location?: string;
  budget?: { min?: number; max?: number };
  householdInfo?: Record<string, unknown>;
}

@Injectable()
export class RecommendationsService {
  private readonly logger = new Logger(RecommendationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async personalized(preferences: Preferences, limit?: number) {
    const take = limit ?? 10;

    const where: any = {
      listingStatus: ListingStatus.PUBLISHED,
      moderationStatus: ModerationStatus.APPROVED,
    };

    if (preferences.petType) {
      where.pet = { petType: preferences.petType };
    }
    if (preferences.size) {
      where.pet = { ...where.pet, sizeCategory: preferences.size };
    }
    if (preferences.location) {
      where.locationCity = {
        contains: preferences.location,
        mode: 'insensitive',
      };
    }
    if (preferences.budget?.max) {
      where.feeAmount = { lte: preferences.budget.max };
      if (preferences.budget.min) {
        where.feeAmount.gte = preferences.budget.min;
      }
    }

    const listings = await this.prisma.petListing.findMany({
      where,
      include: {
        pet: { include: { media: { where: { isPrimary: true }, take: 1 } } },
      },
      orderBy: { publishedAt: 'desc' },
      take: 50,
    });

    const formattedListings = listings.map((l) => ({
      id: l.id,
      title: l.title,
      petType: l.pet.petType,
      breed: l.pet.breedPrimary,
      size: l.pet.sizeCategory,
      location: l.locationCity,
      fee: l.feeAmount ? Number(l.feeAmount) : null,
    }));

    const template = DEFAULT_REGISTRY.get('recommendation');
    const rendered = DEFAULT_REGISTRY.render('recommendation', {
      userPreferences: JSON.stringify(preferences),
      availableListings: JSON.stringify(formattedListings),
      userHistory: '[]',
    });

    const provider = getDefaultProvider();
    const startTime = Date.now();
    const response = await provider.complete({
      systemPrompt: rendered.systemPrompt,
      messages: [{ role: 'user', content: rendered.userPrompt }],
    });
    const latencyMs = Date.now() - startTime;

    await this.prisma.aIInteraction.create({
      data: {
        channelType: AIChannelType.WEB_CHAT,
        promptVersion: template?.version ?? 'unknown',
        modelName: response.model,
        inputSummary: `Personalized recommendations: ${JSON.stringify(preferences).substring(0, 200)}`,
        outputSummary: response.content.substring(0, 500),
      },
    });

    this.logger.log(
      `Personalized recommendations completed in ${latencyMs}ms, ${listings.length} candidates`,
    );

    let ranked: Array<{
      listingId: string;
      matchScore: number;
      explanation: string;
    }>;
    try {
      ranked = JSON.parse(response.content);
    } catch {
      ranked = formattedListings.slice(0, take).map((l) => ({
        listingId: l.id,
        matchScore: 0.7,
        explanation: response.content,
      }));
    }

    const listingMap = new Map(listings.map((l) => [l.id, l]));

    return {
      recommendations: ranked.slice(0, take).map((r) => {
        const listing = listingMap.get(r.listingId);
        return {
          listingId: r.listingId,
          matchScore: r.matchScore,
          explanation: r.explanation,
          listing: listing
            ? {
                id: listing.id,
                title: listing.title,
                petType: listing.pet.petType,
                breed: listing.pet.breedPrimary,
                size: listing.pet.sizeCategory,
                location: listing.locationCity,
                fee: listing.feeAmount ? Number(listing.feeAmount) : null,
                image: (listing.pet.media?.[0]?.storageKey as string) ?? null,
              }
            : null,
        };
      }),
    };
  }

  async similar(listingId: string, limit?: number) {
    const take = limit ?? 5;

    const listing = await this.prisma.petListing.findUnique({
      where: { id: listingId },
      include: { pet: true },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    const similarListings = await this.prisma.petListing.findMany({
      where: {
        id: { not: listingId },
        listingStatus: ListingStatus.PUBLISHED,
        moderationStatus: ModerationStatus.APPROVED,
        pet: { petType: listing.pet.petType },
      },
      include: {
        pet: { include: { media: { where: { isPrimary: true }, take: 1 } } },
      },
      orderBy: { publishedAt: 'desc' },
      take: 30,
    });

    const sourceListing = {
      id: listing.id,
      title: listing.title,
      petType: listing.pet.petType,
      breed: listing.pet.breedPrimary,
      size: listing.pet.sizeCategory,
      location: listing.locationCity,
    };

    const candidates = similarListings.map((l) => ({
      id: l.id,
      title: l.title,
      petType: l.pet.petType,
      breed: l.pet.breedPrimary,
      size: l.pet.sizeCategory,
      location: l.locationCity,
      fee: l.feeAmount ? Number(l.feeAmount) : null,
    }));

    const provider = getDefaultProvider();
    const systemPrompt =
      'You rank pet listings by similarity. Given a source listing and candidates, return a JSON array of { listingId, similarityScore (0-1), explanation } sorted by similarity descending.';
    const userPrompt = `Source listing:\n${JSON.stringify(sourceListing)}\n\nCandidates:\n${JSON.stringify(candidates)}\n\nReturn the top ${take} most similar listings as a JSON array.`;

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
        promptVersion: 'similar-listings-v1',
        modelName: response.model,
        inputSummary: `Similar to listing ${listingId}`,
        outputSummary: response.content.substring(0, 500),
      },
    });

    this.logger.log(
      `Similar listings for ${listingId} completed in ${latencyMs}ms`,
    );

    let ranked: Array<{
      listingId: string;
      similarityScore: number;
      explanation: string;
    }>;
    try {
      ranked = JSON.parse(response.content);
    } catch {
      ranked = candidates.slice(0, take).map((c) => ({
        listingId: c.id,
        similarityScore: 0.5,
        explanation: response.content,
      }));
    }

    const listingMap = new Map(similarListings.map((l) => [l.id, l]));

    return {
      sourceListingId: listingId,
      similar: ranked.slice(0, take).map((r) => {
        const match = listingMap.get(r.listingId);
        return {
          listingId: r.listingId,
          similarityScore: r.similarityScore,
          explanation: r.explanation,
          listing: match
            ? {
                id: match.id,
                title: match.title,
                petType: match.pet.petType,
                breed: match.pet.breedPrimary,
                size: match.pet.sizeCategory,
                location: match.locationCity,
                fee: match.feeAmount ? Number(match.feeAmount) : null,
                image: (match.pet.media?.[0]?.storageKey as string) ?? null,
              }
            : null,
        };
      }),
    };
  }
}
