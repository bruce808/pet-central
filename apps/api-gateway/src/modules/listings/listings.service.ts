import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../../common/prisma.service';
import { ListingStatus, ModerationStatus, PetType, Prisma } from '@pet-central/database';

@Injectable()
export class ListingsService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('moderation') private readonly moderationQueue: Queue,
    @InjectQueue('search-index') private readonly searchIndexQueue: Queue,
  ) {}

  private mapMedia(media: { id: string; mediaType: string; storageKey: string; sortOrder: number; isPrimary: boolean }) {
    return {
      id: media.id,
      mediaType: media.mediaType,
      url: media.storageKey,
      sortOrder: media.sortOrder,
      isPrimary: media.isPrimary,
    };
  }

  private mapPetResponse(pet: any) {
    return {
      ...pet,
      temperament: pet.temperamentJson ?? [],
      health: pet.healthJson ?? {},
      attributes: Object.fromEntries(
        (pet.attributes ?? []).map((a: any) => [a.attributeKey, a.attributeValue]),
      ),
      media: (pet.media ?? []).map((m: any) => this.mapMedia(m)),
    };
  }

  private mapListingResponse(listing: any) {
    const pet = listing.pet;
    const org = pet?.organization;
    return {
      ...listing,
      pet: this.mapPetResponse(pet),
      organization: org
        ? { id: org.id, publicName: org.publicName, organizationType: org.organizationType }
        : undefined,
      media: (pet?.media ?? []).map((m: any) => this.mapMedia(m)),
    };
  }

  async createPet(userId: string, dto: Record<string, any>) {
    await this.verifyOrgMembership(dto.organizationId, userId);

    return this.prisma.pet.create({
      data: {
        organizationId: dto.organizationId,
        petType: dto.petType,
        breedPrimary: dto.breedPrimary,
        name: dto.name,
        description: dto.description,
        sex: dto.sex,
        ageValue: dto.ageValue,
        ageUnit: dto.ageUnit,
        sizeCategory: dto.sizeCategory,
        color: dto.color,
        temperamentJson: dto.temperament,
        healthJson: dto.health,
        adoptionOrSaleType: dto.adoptionOrSaleType,
      },
      include: { media: true },
    });
  }

  async updatePet(petId: string, userId: string, dto: Record<string, any>) {
    const pet = await this.prisma.pet.findUnique({ where: { id: petId } });
    if (!pet) throw new NotFoundException('Pet not found');

    await this.verifyOrgMembership(pet.organizationId, userId);

    return this.prisma.pet.update({
      where: { id: petId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.breedPrimary !== undefined && { breedPrimary: dto.breedPrimary }),
        ...(dto.sex !== undefined && { sex: dto.sex }),
        ...(dto.ageValue !== undefined && { ageValue: dto.ageValue }),
        ...(dto.ageUnit !== undefined && { ageUnit: dto.ageUnit }),
        ...(dto.sizeCategory !== undefined && { sizeCategory: dto.sizeCategory }),
        ...(dto.color !== undefined && { color: dto.color }),
        ...(dto.temperament !== undefined && { temperamentJson: dto.temperament }),
        ...(dto.health !== undefined && { healthJson: dto.health }),
        ...(dto.adoptionOrSaleType !== undefined && { adoptionOrSaleType: dto.adoptionOrSaleType }),
      },
      include: { media: true },
    });
  }

  async addMedia(petId: string, userId: string, dto: Record<string, any>) {
    const pet = await this.prisma.pet.findUnique({ where: { id: petId } });
    if (!pet) throw new NotFoundException('Pet not found');

    await this.verifyOrgMembership(pet.organizationId, userId);

    return this.prisma.petMedia.create({
      data: {
        petId,
        mediaType: dto.mediaType,
        storageKey: dto.storageKey,
        sortOrder: dto.sortOrder ?? 0,
        isPrimary: dto.isPrimary ?? false,
      },
    });
  }

  async removeMedia(petId: string, mediaId: string, userId: string) {
    const pet = await this.prisma.pet.findUnique({ where: { id: petId } });
    if (!pet) throw new NotFoundException('Pet not found');

    await this.verifyOrgMembership(pet.organizationId, userId);

    const media = await this.prisma.petMedia.findFirst({
      where: { id: mediaId, petId },
    });
    if (!media) throw new NotFoundException('Media not found');

    await this.prisma.petMedia.delete({ where: { id: mediaId } });
    return { message: 'Media removed' };
  }

  async createListing(userId: string, dto: Record<string, any>) {
    const pet = await this.prisma.pet.findUnique({
      where: { id: dto.petId },
      include: { listing: true },
    });
    if (!pet) throw new NotFoundException('Pet not found');

    await this.verifyOrgMembership(pet.organizationId, userId);

    if (pet.listing) {
      throw new BadRequestException('This pet already has a listing');
    }

    const listing = await this.prisma.petListing.create({
      data: {
        petId: dto.petId,
        title: dto.title,
        summary: dto.summary,
        feeAmount: dto.feeAmount,
        feeCurrency: dto.feeCurrency,
        availableFrom: dto.availableFrom ? new Date(dto.availableFrom) : undefined,
        locationCity: dto.locationCity,
        locationRegion: dto.locationRegion,
        locationCountry: dto.locationCountry,
        latitude: dto.latitude,
        longitude: dto.longitude,
        listingStatus: ListingStatus.DRAFT,
      },
      include: { pet: { include: { media: true, organization: true } } },
    });

    await this.moderationQueue.add('moderate-listing', {
      listingId: listing.id,
      contentType: 'listing',
    });

    return listing;
  }

  async updateListing(
    listingId: string,
    userId: string,
    dto: Record<string, any>,
  ) {
    const listing = await this.prisma.petListing.findUnique({
      where: { id: listingId },
      include: { pet: true },
    });
    if (!listing) throw new NotFoundException('Listing not found');

    await this.verifyOrgMembership(listing.pet.organizationId, userId);

    const previousStatus = listing.listingStatus;

    const updated = await this.prisma.petListing.update({
      where: { id: listingId },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.summary !== undefined && { summary: dto.summary }),
        ...(dto.feeAmount !== undefined && { feeAmount: dto.feeAmount }),
        ...(dto.feeCurrency !== undefined && { feeCurrency: dto.feeCurrency }),
        ...(dto.availableFrom !== undefined && { availableFrom: new Date(dto.availableFrom) }),
        ...(dto.locationCity !== undefined && { locationCity: dto.locationCity }),
        ...(dto.locationRegion !== undefined && { locationRegion: dto.locationRegion }),
        ...(dto.locationCountry !== undefined && { locationCountry: dto.locationCountry }),
        ...(dto.latitude !== undefined && { latitude: dto.latitude }),
        ...(dto.longitude !== undefined && { longitude: dto.longitude }),
        ...(dto.listingStatus !== undefined && { listingStatus: dto.listingStatus }),
        ...(dto.availabilityStatus !== undefined && { availabilityStatus: dto.availabilityStatus }),
        ...(dto.listingStatus === ListingStatus.PUBLISHED && { publishedAt: new Date() }),
      },
      include: { pet: { include: { media: true, organization: true } } },
    });

    if (
      dto.listingStatus === ListingStatus.PUBLISHED &&
      previousStatus !== ListingStatus.PUBLISHED
    ) {
      await this.searchIndexQueue.add('index-listing', { listingId });
    }

    const hasContentChanges =
      dto.title !== undefined || dto.summary !== undefined;
    if (hasContentChanges) {
      await this.moderationQueue.add('moderate-listing', {
        listingId,
        contentType: 'listing',
      });
    }

    return updated;
  }

  async getListing(listingId: string) {
    const listing = await this.prisma.petListing.findUnique({
      where: { id: listingId },
      include: {
        pet: {
          include: {
            media: { orderBy: { sortOrder: 'asc' } },
            attributes: true,
            organization: {
              include: {
                badges: {
                  include: { badge: true },
                  where: {
                    OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!listing) throw new NotFoundException('Listing not found');

    const reviewStats = await this.prisma.review.aggregate({
      where: {
        subjectType: 'ORGANIZATION_SUBJECT',
        subjectId: listing.pet.organizationId,
        moderationStatus: ModerationStatus.APPROVED,
      },
      _avg: { ratingOverall: true },
      _count: { id: true },
    });

    return {
      ...this.mapListingResponse(listing),
      reviewStats: {
        averageRating: reviewStats._avg.ratingOverall,
        reviewCount: reviewStats._count.id,
      },
    };
  }

  async getListings(query: Record<string, any>) {
    const page = parseInt(query.page, 10) || 1;
    const limit = Math.min(parseInt(query.limit, 10) || 20, 100);
    const skip = (page - 1) * limit;

    const where: Prisma.PetListingWhereInput = {
      listingStatus: ListingStatus.PUBLISHED,
      moderationStatus: ModerationStatus.APPROVED,
    };

    if (query.petType) {
      where.pet = { petType: query.petType.toUpperCase() as PetType };
    }

    if (query.availabilityStatus) {
      where.availabilityStatus = query.availabilityStatus;
    }

    if (query.locationCity) {
      where.locationCity = { contains: query.locationCity, mode: 'insensitive' };
    }

    if (query.locationRegion) {
      where.locationRegion = { contains: query.locationRegion, mode: 'insensitive' };
    }

    if (query.locationCountry) {
      where.locationCountry = query.locationCountry;
    }

    const [listings, total] = await Promise.all([
      this.prisma.petListing.findMany({
        where,
        include: {
          pet: {
            include: {
              media: {
                where: { isPrimary: true },
                take: 1,
              },
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
      data: listings.map((l) => this.mapListingResponse(l)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async publishListing(listingId: string, userId: string) {
    const listing = await this.prisma.petListing.findUnique({
      where: { id: listingId },
      include: {
        pet: {
          include: {
            organization: {
              include: { verifications: { where: { status: 'APPROVED' } } },
            },
          },
        },
      },
    });

    if (!listing) throw new NotFoundException('Listing not found');

    await this.verifyOrgMembership(listing.pet.organizationId, userId);

    const validStatuses: ListingStatus[] = [
      ListingStatus.DRAFT,
      ListingStatus.PENDING_REVIEW,
    ];
    if (!validStatuses.includes(listing.listingStatus)) {
      throw new BadRequestException(
        `Cannot publish listing with status ${listing.listingStatus}`,
      );
    }

    if (listing.pet.organization.verifications.length === 0) {
      throw new ForbiddenException(
        'Organization must have at least one approved verification to publish listings',
      );
    }

    const updated = await this.prisma.petListing.update({
      where: { id: listingId },
      data: {
        listingStatus: ListingStatus.PUBLISHED,
        publishedAt: new Date(),
      },
      include: { pet: { include: { media: true, organization: true } } },
    });

    await this.searchIndexQueue.add('index-listing', { listingId });

    return updated;
  }

  private async verifyOrgMembership(organizationId: string, userId: string) {
    const membership = await this.prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: { organizationId, userId },
      },
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this organization');
    }

    return membership;
  }
}
