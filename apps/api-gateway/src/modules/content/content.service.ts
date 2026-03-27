import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../../common/prisma.service';
import { ResourceType, ResourceStatus, Prisma } from '@pet-central/database';

interface CreateResourceDto {
  resourceType: string;
  title: string;
  slug: string;
  bodyMarkdown: string;
  tagsJson?: any;
  organizationId?: string;
}

interface UpdateResourceDto {
  title?: string;
  bodyMarkdown?: string;
  tagsJson?: any;
  status?: string;
}

interface ResourceFilters {
  type?: string;
  tags?: string;
}

@Injectable()
export class ContentService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('moderation') private readonly moderationQueue: Queue,
  ) {}

  async getResources(filters: ResourceFilters, page: number, limit: number) {
    const safeLimit = Math.min(limit, 100);
    const skip = (page - 1) * safeLimit;

    const where: Prisma.ResourceWhereInput = {
      status: ResourceStatus.PUBLISHED_RESOURCE,
    };

    if (filters.type) {
      where.resourceType = filters.type as ResourceType;
    }

    if (filters.tags) {
      where.tagsJson = { array_contains: filters.tags.split(',') };
    }

    const [resources, total] = await Promise.all([
      this.prisma.resource.findMany({
        where,
        select: {
          id: true,
          resourceType: true,
          title: true,
          slug: true,
          tagsJson: true,
          publishedAt: true,
          createdAt: true,
          author: {
            select: { id: true, email: true, profile: { select: { displayName: true } } },
          },
          organization: {
            select: { id: true, publicName: true },
          },
        },
        orderBy: { publishedAt: 'desc' },
        skip,
        take: safeLimit,
      }),
      this.prisma.resource.count({ where }),
    ]);

    return {
      data: resources,
      meta: { total, page, limit: safeLimit, totalPages: Math.ceil(total / safeLimit) },
    };
  }

  async getResourceBySlug(slug: string) {
    const resource = await this.prisma.resource.findUnique({
      where: { slug },
      include: {
        author: {
          select: { id: true, email: true, profile: { select: { displayName: true, avatarUrl: true } } },
        },
        organization: {
          select: { id: true, publicName: true },
        },
      },
    });

    if (!resource || resource.status !== ResourceStatus.PUBLISHED_RESOURCE) {
      throw new NotFoundException('Resource not found');
    }

    return resource;
  }

  async createResource(userId: string, dto: CreateResourceDto) {
    if (dto.organizationId) {
      const membership = await this.prisma.organizationMember.findUnique({
        where: {
          organizationId_userId: {
            organizationId: dto.organizationId,
            userId,
          },
        },
      });

      if (!membership) {
        throw new ForbiddenException(
          'You are not a member of this organization',
        );
      }
    }

    const resource = await this.prisma.resource.create({
      data: {
        authorUserId: userId,
        organizationId: dto.organizationId,
        resourceType: dto.resourceType as ResourceType,
        title: dto.title,
        slug: dto.slug,
        bodyMarkdown: dto.bodyMarkdown,
        tagsJson: dto.tagsJson,
        status: ResourceStatus.DRAFT_RESOURCE,
      },
    });

    await this.moderationQueue.add('moderate-resource', {
      resourceId: resource.id,
      contentType: 'resource',
    });

    return resource;
  }

  async updateResource(
    resourceId: string,
    userId: string,
    dto: UpdateResourceDto,
  ) {
    const resource = await this.prisma.resource.findUnique({
      where: { id: resourceId },
    });
    if (!resource) throw new NotFoundException('Resource not found');

    if (resource.authorUserId !== userId) {
      throw new ForbiddenException('You do not own this resource');
    }

    const contentChanged =
      dto.title !== undefined || dto.bodyMarkdown !== undefined;

    const updated = await this.prisma.resource.update({
      where: { id: resourceId },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.bodyMarkdown !== undefined && { bodyMarkdown: dto.bodyMarkdown }),
        ...(dto.tagsJson !== undefined && { tagsJson: dto.tagsJson }),
        ...(dto.status !== undefined && {
          status: dto.status as ResourceStatus,
          ...(dto.status === ResourceStatus.PUBLISHED_RESOURCE && {
            publishedAt: new Date(),
          }),
        }),
      },
    });

    if (contentChanged) {
      await this.moderationQueue.add('moderate-resource', {
        resourceId,
        contentType: 'resource',
      });
    }

    return updated;
  }
}
