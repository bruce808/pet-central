import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { WebsiteScanStatus } from '@pet-central/database';

@Injectable()
export class ScansService {
  constructor(private readonly prisma: PrismaService) {}

  async createScan(
    websiteId: string,
    scanType: string = 'FULL',
    triggerType: string = 'MANUAL',
    notes?: string,
  ) {
    return this.prisma.websiteScan.create({
      data: {
        websiteId,
        scanType: scanType as any,
        triggerType: triggerType as any,
        status: WebsiteScanStatus.RUNNING,
        notes,
      },
    });
  }

  async finalizeScan(scanId: string, status: WebsiteScanStatus) {
    const scan = await this.prisma.websiteScan.findUnique({
      where: { id: scanId },
      include: {
        _count: {
          select: { pages: true, animalListings: true },
        },
      },
    });
    if (!scan) throw new NotFoundException('Scan not found');

    return this.prisma.websiteScan.update({
      where: { id: scanId },
      data: {
        status,
        completedAt: new Date(),
        pageCount: scan._count.pages,
        listingCount: scan._count.animalListings,
      },
    });
  }

  async list(query: Record<string, any>) {
    const page = parseInt(query.page, 10) || 1;
    const limit = Math.min(parseInt(query.limit, 10) || 20, 100);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.websiteId) where.websiteId = query.websiteId;
    if (query.status) where.status = query.status;

    const [items, total] = await Promise.all([
      this.prisma.websiteScan.findMany({
        where,
        orderBy: { startedAt: 'desc' },
        skip,
        take: limit,
        include: {
          website: { select: { domain: true, baseUrl: true } },
        },
      }),
      this.prisma.websiteScan.count({ where }),
    ]);

    return {
      data: items,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findById(scanId: string) {
    const scan = await this.prisma.websiteScan.findUnique({
      where: { id: scanId },
      include: {
        website: true,
        _count: {
          select: {
            pages: true,
            entities: true,
            animalListings: true,
            qualityChecks: true,
            promotionBatches: true,
          },
        },
      },
    });
    if (!scan) throw new NotFoundException('Scan not found');

    return {
      ...scan,
      counts: {
        pages: scan._count.pages,
        entities: scan._count.entities,
        animalListings: scan._count.animalListings,
        qualityChecks: scan._count.qualityChecks,
        promotionBatches: scan._count.promotionBatches,
      },
      _count: undefined,
    };
  }

  async getStatistics(scanId: string) {
    const scan = await this.prisma.websiteScan.findUnique({ where: { id: scanId } });
    if (!scan) throw new NotFoundException('Scan not found');

    const [pagesByType, animalsByType, qualityChecks, totalPages, totalEntities, totalAnimals] =
      await Promise.all([
        this.prisma.scanPage.groupBy({
          by: ['pageType'],
          where: { scanId },
          _count: true,
        }),
        this.prisma.scanAnimalListing.groupBy({
          by: ['animalType'],
          where: { scanId },
          _count: true,
        }),
        this.prisma.scanQualityCheck.groupBy({
          by: ['checkStatus'],
          where: { scanId },
          _count: true,
        }),
        this.prisma.scanPage.count({ where: { scanId } }),
        this.prisma.scanEntity.count({ where: { scanId } }),
        this.prisma.scanAnimalListing.count({ where: { scanId } }),
      ]);

    const qualitySummary = {
      passed: 0,
      warnings: 0,
      failures: 0,
    };
    for (const check of qualityChecks) {
      if (check.checkStatus === 'PASS') qualitySummary.passed = check._count;
      else if (check.checkStatus === 'WARN') qualitySummary.warnings = check._count;
      else if (check.checkStatus === 'FAIL') qualitySummary.failures = check._count;
    }

    return {
      scanId,
      totalPages,
      totalEntities,
      totalAnimalListings: totalAnimals,
      qualitySummary: {
        ...qualitySummary,
        total: qualitySummary.passed + qualitySummary.warnings + qualitySummary.failures,
        isPromotable: qualitySummary.failures === 0,
      },
      pageTypeBreakdown: Object.fromEntries(
        pagesByType.map((p) => [p.pageType, p._count]),
      ),
      animalTypeBreakdown: Object.fromEntries(
        animalsByType.map((a) => [a.animalType ?? 'UNKNOWN', a._count]),
      ),
    };
  }

  async getPages(scanId: string, query: Record<string, any>) {
    const page = parseInt(query.page, 10) || 1;
    const limit = Math.min(parseInt(query.limit, 10) || 50, 200);
    const skip = (page - 1) * limit;

    const where: any = { scanId };
    if (query.pageType) where.pageType = query.pageType;
    if (query.isListingPage !== undefined) where.isListingPage = query.isListingPage === 'true';

    const [items, total] = await Promise.all([
      this.prisma.scanPage.findMany({
        where,
        orderBy: { createdAt: 'asc' },
        skip,
        take: limit,
        include: {
          markdown: { select: { scanPageId: true } },
          _count: { select: { extractions: true } },
        },
      }),
      this.prisma.scanPage.count({ where }),
    ]);

    return {
      data: items.map((p) => ({
        ...p,
        hasMarkdown: !!p.markdown,
        extractionCount: p._count.extractions,
        markdown: undefined,
        _count: undefined,
      })),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getEntities(scanId: string) {
    return this.prisma.scanEntity.findMany({
      where: { scanId },
      include: {
        contacts: true,
        _count: { select: { contacts: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getAnimalListings(scanId: string, query: Record<string, any>) {
    const page = parseInt(query.page, 10) || 1;
    const limit = Math.min(parseInt(query.limit, 10) || 50, 200);
    const skip = (page - 1) * limit;

    const where: any = { scanId };
    if (query.animalType) where.animalType = query.animalType;

    const [items, total] = await Promise.all([
      this.prisma.scanAnimalListing.findMany({
        where,
        orderBy: { createdAt: 'asc' },
        skip,
        take: limit,
        include: {
          markdown: { select: { scanAnimalListingId: true } },
          _count: { select: { evidence: true } },
        },
      }),
      this.prisma.scanAnimalListing.count({ where }),
    ]);

    return {
      data: items.map((a) => ({
        ...a,
        hasMarkdown: !!a.markdown,
        evidenceCount: a._count.evidence,
        photoUrls: (a.photoUrlsJson as string[]) ?? [],
        markdown: undefined,
        _count: undefined,
      })),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }
}
