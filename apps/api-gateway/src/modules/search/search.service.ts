import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import {
  createSearchClient,
  buildListingSearchQuery,
  buildOrganizationSearchQuery,
  LISTING_INDEX,
  ORGANIZATION_INDEX,
} from '@pet-central/search';
import type { SearchClient } from '@pet-central/search';
import { ListingStatus, ModerationStatus, Prisma } from '@pet-central/database';

interface ListingSearchParams {
  query?: string;
  petType?: string;
  breed?: string;
  locationLat?: number;
  locationLon?: number;
  radiusKm?: number;
  orgType?: string;
  minFee?: number;
  maxFee?: number;
  sex?: string;
  sizeCategory?: string;
  temperament?: string;
  availabilityStatus?: string;
  sortBy?: string;
  page?: number;
  limit?: number;
}

interface OrgSearchParams {
  query?: string;
  orgType?: string;
  locationLat?: number;
  locationLon?: number;
  radiusKm?: number;
  sortBy?: string;
  page?: number;
  limit?: number;
}

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);
  private searchClient: SearchClient;

  constructor(private readonly prisma: PrismaService) {
    this.searchClient = createSearchClient();
  }

  async searchListings(params: ListingSearchParams) {
    const page = params.page ?? 1;
    const limit = Math.min(params.limit ?? 20, 100);

    try {
      const searchBody = buildListingSearchQuery({
        query: params.query,
        petType: params.petType,
        breed: params.breed,
        location:
          params.locationLat != null && params.locationLon != null
            ? { lat: params.locationLat, lon: params.locationLon }
            : undefined,
        radiusKm: params.radiusKm,
        orgType: params.orgType,
        minFee: params.minFee,
        maxFee: params.maxFee,
        sex: params.sex,
        size: params.sizeCategory,
        temperament: params.temperament ? params.temperament.split(',') : undefined,
        availabilityStatus: params.availabilityStatus,
        sortBy: params.sortBy,
        page,
        limit,
      });

      const response = await this.searchClient.search({
        index: LISTING_INDEX,
        body: searchBody,
      });

      const hits = response.body.hits;
      const total =
        typeof hits.total === 'number' ? hits.total : hits.total?.value ?? 0;
      const results = hits.hits.map((hit: any) => ({
        id: hit._id,
        score: hit._score,
        ...hit._source,
      }));

      return {
        data: results,
        meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
      };
    } catch (error) {
      this.logger.warn(
        'OpenSearch unavailable, falling back to Prisma query',
        error instanceof Error ? error.message : error,
      );
      return this.fallbackListingSearch(params, page, limit);
    }
  }

  async searchOrganizations(params: OrgSearchParams) {
    const page = params.page ?? 1;
    const limit = Math.min(params.limit ?? 20, 100);

    try {
      const searchBody = buildOrganizationSearchQuery({
        query: params.query,
        orgType: params.orgType,
        location:
          params.locationLat != null && params.locationLon != null
            ? { lat: params.locationLat, lon: params.locationLon }
            : undefined,
        radiusKm: params.radiusKm,
        sortBy: params.sortBy,
        page,
        limit,
      });

      const response = await this.searchClient.search({
        index: ORGANIZATION_INDEX,
        body: searchBody,
      });

      const hits = response.body.hits;
      const total =
        typeof hits.total === 'number' ? hits.total : hits.total?.value ?? 0;
      const results = hits.hits.map((hit: any) => ({
        id: hit._id,
        score: hit._score,
        ...hit._source,
      }));

      return {
        data: results,
        meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
      };
    } catch (error) {
      this.logger.warn(
        'OpenSearch unavailable, falling back to Prisma query',
        error instanceof Error ? error.message : error,
      );
      return this.fallbackOrganizationSearch(params, page, limit);
    }
  }

  private async fallbackListingSearch(
    params: ListingSearchParams,
    page: number,
    limit: number,
  ) {
    const skip = (page - 1) * limit;

    const where: Prisma.PetListingWhereInput = {
      listingStatus: ListingStatus.PUBLISHED,
      moderationStatus: ModerationStatus.APPROVED,
    };

    const petWhere: Prisma.PetWhereInput = {};

    if (params.query) {
      where.OR = [
        { title: { contains: params.query, mode: 'insensitive' } },
        { summary: { contains: params.query, mode: 'insensitive' } },
      ];
    }

    if (params.petType) petWhere.petType = params.petType as any;
    if (params.breed) petWhere.breedPrimary = { contains: params.breed, mode: 'insensitive' };
    if (params.sex) petWhere.sex = params.sex as any;
    if (params.sizeCategory) petWhere.sizeCategory = params.sizeCategory as any;

    if (Object.keys(petWhere).length > 0) {
      where.pet = petWhere;
    }

    if (params.availabilityStatus) {
      where.availabilityStatus = params.availabilityStatus as any;
    }

    if (params.minFee !== undefined || params.maxFee !== undefined) {
      where.feeAmount = {};
      if (params.minFee !== undefined) where.feeAmount.gte = params.minFee;
      if (params.maxFee !== undefined) where.feeAmount.lte = params.maxFee;
    }

    const [listings, total] = await Promise.all([
      this.prisma.petListing.findMany({
        where,
        include: {
          pet: {
            include: {
              media: { where: { isPrimary: true }, take: 1 },
              organization: {
                select: { id: true, publicName: true, organizationType: true },
              },
            },
          },
        },
        orderBy: { publishedAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.petListing.count({ where }),
    ]);

    return {
      data: listings,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  private async fallbackOrganizationSearch(
    params: OrgSearchParams,
    page: number,
    limit: number,
  ) {
    const skip = (page - 1) * limit;

    const where: Prisma.OrganizationWhereInput = {
      status: 'ACTIVE',
    };

    if (params.query) {
      where.OR = [
        { publicName: { contains: params.query, mode: 'insensitive' } },
        { legalName: { contains: params.query, mode: 'insensitive' } },
        { description: { contains: params.query, mode: 'insensitive' } },
      ];
    }

    if (params.orgType) {
      where.organizationType = params.orgType as any;
    }

    const [organizations, total] = await Promise.all([
      this.prisma.organization.findMany({
        where,
        include: {
          badges: { include: { badge: true } },
          _count: { select: { pets: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.organization.count({ where }),
    ]);

    return {
      data: organizations,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }
}
