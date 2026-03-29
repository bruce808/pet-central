import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

@Injectable()
export class WebsitesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: Record<string, any>) {
    const existing = await this.prisma.crawlWebsite.findUnique({
      where: { domain: dto.domain },
    });
    if (existing) {
      throw new ConflictException(`Website with domain ${dto.domain} already exists`);
    }

    return this.prisma.crawlWebsite.create({
      data: {
        domain: dto.domain,
        baseUrl: dto.baseUrl,
        sourceType: dto.sourceType,
        organizationHint: dto.organizationHint,
      },
    });
  }

  async list(query: Record<string, any>) {
    const page = parseInt(query.page, 10) || 1;
    const limit = Math.min(parseInt(query.limit, 10) || 20, 100);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.active !== undefined) {
      where.active = query.active === 'true';
    }
    if (query.sourceType) {
      where.sourceType = query.sourceType;
    }
    if (query.domain) {
      where.domain = { contains: query.domain, mode: 'insensitive' };
    }

    const [items, total] = await Promise.all([
      this.prisma.crawlWebsite.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          _count: { select: { scans: true } },
        },
      }),
      this.prisma.crawlWebsite.count({ where }),
    ]);

    return {
      data: items.map((w) => ({
        ...w,
        scanCount: w._count.scans,
        _count: undefined,
      })),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findById(id: string) {
    const website = await this.prisma.crawlWebsite.findUnique({
      where: { id },
      include: {
        _count: { select: { scans: true } },
        scans: {
          orderBy: { startedAt: 'desc' },
          take: 5,
        },
      },
    });
    if (!website) throw new NotFoundException('Website not found');

    return {
      ...website,
      scanCount: website._count.scans,
      recentScans: website.scans,
      _count: undefined,
      scans: undefined,
    };
  }

  async update(id: string, dto: Record<string, any>) {
    const website = await this.prisma.crawlWebsite.findUnique({ where: { id } });
    if (!website) throw new NotFoundException('Website not found');

    return this.prisma.crawlWebsite.update({
      where: { id },
      data: {
        ...(dto.baseUrl !== undefined && { baseUrl: dto.baseUrl }),
        ...(dto.sourceType !== undefined && { sourceType: dto.sourceType }),
        ...(dto.organizationHint !== undefined && { organizationHint: dto.organizationHint }),
        ...(dto.active !== undefined && { active: dto.active }),
        ...(dto.extractionConfig !== undefined && { extractionConfig: dto.extractionConfig }),
      },
    });
  }

  async getScans(websiteId: string, query: Record<string, any>) {
    const website = await this.prisma.crawlWebsite.findUnique({ where: { id: websiteId } });
    if (!website) throw new NotFoundException('Website not found');

    const page = parseInt(query.page, 10) || 1;
    const limit = Math.min(parseInt(query.limit, 10) || 20, 100);
    const skip = (page - 1) * limit;

    const where: any = { websiteId };
    if (query.status) {
      where.status = query.status;
    }

    const [items, total] = await Promise.all([
      this.prisma.websiteScan.findMany({
        where,
        orderBy: { startedAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.websiteScan.count({ where }),
    ]);

    return {
      data: items,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }
}
