import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import {
  PromotionStatus,
  PromotionAction,
  PromotionRecordType,
  OrgType,
  AdoptionOrSaleType,
  PetType,
} from '@pet-central/database';

@Injectable()
export class PromotionService {
  private readonly logger = new Logger(PromotionService.name);

  constructor(private readonly prisma: PrismaService) {}

  async promoteScan(scanId: string, approvedBy?: string, notes?: string) {
    const scan = await this.prisma.websiteScan.findUnique({
      where: { id: scanId },
    });
    if (!scan) throw new NotFoundException('Scan not found');
    if (scan.status !== 'COMPLETED') {
      throw new BadRequestException('Only completed scans can be promoted');
    }

    const failedChecks = await this.prisma.scanQualityCheck.count({
      where: { scanId, checkStatus: 'FAIL' },
    });
    if (failedChecks > 0) {
      throw new BadRequestException(
        `Scan has ${failedChecks} failed quality checks and cannot be promoted`,
      );
    }

    const batch = await this.prisma.scanPromotionBatch.create({
      data: {
        scanId,
        status: PromotionStatus.PROMOTION_IN_PROGRESS,
        approvedBy,
        notes,
      },
    });

    try {
      await this.promoteEntities(scanId, batch.id);
      await this.promoteAnimalListings(scanId, batch.id);

      await this.prisma.scanPromotionBatch.update({
        where: { id: batch.id },
        data: {
          status: PromotionStatus.PROMOTION_COMPLETED,
          completedAt: new Date(),
        },
      });

      this.logger.log(`Promotion batch ${batch.id} completed for scan ${scanId}`);
      return this.getBatch(batch.id);
    } catch (error: any) {
      await this.prisma.scanPromotionBatch.update({
        where: { id: batch.id },
        data: {
          status: PromotionStatus.PROMOTION_FAILED,
          completedAt: new Date(),
        },
      });
      throw error;
    }
  }

  private async promoteEntities(scanId: string, batchId: string) {
    const entities = await this.prisma.scanEntity.findMany({
      where: { scanId },
      include: { contacts: true },
    });

    for (const entity of entities) {
      const existing = entity.canonicalWebsite
        ? await this.prisma.organization.findFirst({
            where: { websiteUrl: entity.canonicalWebsite },
          })
        : null;

      if (existing) {
        await this.prisma.organization.update({
          where: { id: existing.id },
          data: {
            lastSeenScanId: scanId,
            ...(entity.summaryDescription && { description: entity.summaryDescription }),
          },
        });

        await this.prisma.scanPromotionResult.create({
          data: {
            promotionBatchId: batchId,
            recordType: PromotionRecordType.ORGANIZATION_RECORD,
            sourceRecordId: entity.id,
            targetRecordId: existing.id,
            action: PromotionAction.UPDATE,
          },
        });
      } else {
        const orgType = this.mapOrgType(entity.organizationType);
        const org = await this.prisma.organization.create({
          data: {
            legalName: entity.name,
            publicName: entity.name,
            organizationType: orgType,
            description: entity.summaryDescription,
            websiteUrl: entity.canonicalWebsite,
            city: 'Unknown',
            region: 'Unknown',
            country: 'US',
            dataSource: 'website-scan',
            sourceScanId: scanId,
            sourceRecordId: entity.id,
            promotedAt: new Date(),
            promotionBatchId: batchId,
            lastSeenScanId: scanId,
          },
        });

        await this.prisma.scanPromotionResult.create({
          data: {
            promotionBatchId: batchId,
            recordType: PromotionRecordType.ORGANIZATION_RECORD,
            sourceRecordId: entity.id,
            targetRecordId: org.id,
            action: PromotionAction.INSERT,
          },
        });
      }
    }
  }

  private async promoteAnimalListings(scanId: string, batchId: string) {
    const animals = await this.prisma.scanAnimalListing.findMany({
      where: { scanId },
    });

    for (const animal of animals) {
      if (!animal.name && !animal.listingExternalId) {
        await this.prisma.scanPromotionResult.create({
          data: {
            promotionBatchId: batchId,
            recordType: PromotionRecordType.ANIMAL_LISTING_RECORD,
            sourceRecordId: animal.id,
            action: PromotionAction.SKIP,
            notes: 'No name or external ID',
          },
        });
        continue;
      }

      const existing = animal.listingUrl
        ? await this.prisma.pet.findFirst({
            where: {
              dataSource: 'website-scan',
              sourceRecordId: { not: null },
            },
          })
        : null;

      if (existing) {
        await this.prisma.pet.update({
          where: { id: existing.id },
          data: { lastSeenScanId: scanId },
        });

        await this.prisma.scanPromotionResult.create({
          data: {
            promotionBatchId: batchId,
            recordType: PromotionRecordType.ANIMAL_LISTING_RECORD,
            sourceRecordId: animal.id,
            targetRecordId: existing.id,
            action: PromotionAction.UPDATE,
          },
        });
      } else {
        const petType = this.mapPetType(animal.animalType);
        const pet = await this.prisma.pet.create({
          data: {
            organizationId: await this.resolveOrganization(scanId),
            petType,
            name: animal.name ?? 'Unknown',
            breedPrimary: animal.breed,
            breedSecondary: animal.secondaryBreed,
            description: animal.description,
            sex: animal.sex === 'female' ? 'FEMALE' : animal.sex === 'male' ? 'MALE' : 'UNKNOWN',
            color: animal.color,
            adoptionOrSaleType: AdoptionOrSaleType.ADOPTION,
            dataSource: 'website-scan',
            sourceScanId: scanId,
            sourceRecordId: animal.id,
            promotedAt: new Date(),
            promotionBatchId: batchId,
            lastSeenScanId: scanId,
          },
        });

        await this.prisma.scanPromotionResult.create({
          data: {
            promotionBatchId: batchId,
            recordType: PromotionRecordType.ANIMAL_LISTING_RECORD,
            sourceRecordId: animal.id,
            targetRecordId: pet.id,
            action: PromotionAction.INSERT,
          },
        });
      }
    }
  }

  private async resolveOrganization(scanId: string): string {
    const entity = await this.prisma.scanEntity.findFirst({
      where: { scanId },
      orderBy: { confidence: 'desc' },
    });

    if (entity) {
      const org = await this.prisma.organization.findFirst({
        where: {
          OR: [
            { sourceRecordId: entity.id },
            ...(entity.canonicalWebsite ? [{ websiteUrl: entity.canonicalWebsite }] : []),
          ],
        },
      });
      if (org) return org.id;
    }

    const placeholder = await this.prisma.organization.findFirst({
      where: { dataSource: 'website-scan-placeholder', sourceScanId: scanId },
    });
    if (placeholder) return placeholder.id;

    const created = await this.prisma.organization.create({
      data: {
        legalName: 'Unknown Organization',
        publicName: 'Unknown Organization',
        organizationType: OrgType.SHELTER,
        city: 'Unknown',
        region: 'Unknown',
        country: 'US',
        dataSource: 'website-scan-placeholder',
        sourceScanId: scanId,
      },
    });
    return created.id;
  }

  private mapOrgType(type: string | null): OrgType {
    const map: Record<string, OrgType> = {
      HUMANE_SOCIETY: OrgType.HUMANE_SOCIETY,
      SHELTER: OrgType.SHELTER,
      RESCUE: OrgType.RESCUE,
      BREEDER: OrgType.BREEDER,
      FOSTER_NETWORK: OrgType.FOSTER_NETWORK,
      NONPROFIT: OrgType.NONPROFIT,
      AGENCY: OrgType.AGENCY,
    };
    return (type && map[type]) || OrgType.SHELTER;
  }

  private mapPetType(type: string | null | undefined): PetType {
    const map: Record<string, PetType> = {
      SCAN_DOG: PetType.DOG,
      SCAN_CAT: PetType.CAT,
      SCAN_BIRD: PetType.BIRD,
    };
    return (type && map[type]) || PetType.DOG;
  }

  async listBatches(query: Record<string, any>) {
    const page = parseInt(query.page, 10) || 1;
    const limit = Math.min(parseInt(query.limit, 10) || 20, 100);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.scanId) where.scanId = query.scanId;
    if (query.status) where.status = query.status;

    const [items, total] = await Promise.all([
      this.prisma.scanPromotionBatch.findMany({
        where,
        orderBy: { startedAt: 'desc' },
        skip,
        take: limit,
        include: {
          _count: { select: { results: true } },
          scan: { select: { id: true, websiteId: true, status: true } },
        },
      }),
      this.prisma.scanPromotionBatch.count({ where }),
    ]);

    return {
      data: items.map((b) => ({
        ...b,
        resultCount: b._count.results,
        _count: undefined,
      })),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getBatch(batchId: string) {
    const batch = await this.prisma.scanPromotionBatch.findUnique({
      where: { id: batchId },
      include: {
        scan: { select: { id: true, websiteId: true, status: true } },
        _count: { select: { results: true } },
      },
    });
    if (!batch) throw new NotFoundException('Promotion batch not found');

    return {
      ...batch,
      resultCount: batch._count.results,
      _count: undefined,
    };
  }

  async getBatchResults(batchId: string) {
    return this.prisma.scanPromotionResult.findMany({
      where: { promotionBatchId: batchId },
      orderBy: { recordType: 'asc' },
    });
  }
}
