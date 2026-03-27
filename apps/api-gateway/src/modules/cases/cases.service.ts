import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import {
  CaseType,
  CasePriority,
  CaseSeverity,
  CaseStatus,
  VisibilityScope,
  Prisma,
} from '@pet-central/database';

interface CreateCaseDto {
  caseType: string;
  sourceType: string;
  sourceId: string;
  description: string;
  region?: string;
}

interface CaseFilters {
  status?: string;
  caseType?: string;
  priority?: string;
  assignedUserId?: string;
}

interface AssignCaseDto {
  assignedToType: string;
  assignedToId: string;
  dueAt?: string;
  slaPolicyId?: string;
}

interface AddEventDto {
  eventType: string;
  payloadJson?: Record<string, any>;
}

interface AddNoteDto {
  body: string;
  visibility: string;
}

interface UpdateCaseDto {
  status?: string;
  priority?: string;
  severity?: string;
  assignedTeam?: string;
}

@Injectable()
export class CasesService {
  constructor(private readonly prisma: PrismaService) {}

  async createCase(userId: string, dto: CreateCaseDto) {
    const caseRecord = await this.prisma.$transaction(async (tx) => {
      const created = await tx.case.create({
        data: {
          caseType: dto.caseType as CaseType,
          sourceType: dto.sourceType,
          sourceId: dto.sourceId,
          region: dto.region,
          createdByUserId: userId,
        },
      });

      await tx.caseEvent.create({
        data: {
          caseId: created.id,
          eventType: 'case_created',
          actorUserId: userId,
          payloadJson: { description: dto.description },
        },
      });

      return created;
    });

    return caseRecord;
  }

  async getCases(filters: CaseFilters, page: number, limit: number) {
    const safeLimit = Math.min(limit, 100);
    const skip = (page - 1) * safeLimit;

    const where: Prisma.CaseWhereInput = {};
    if (filters.status) where.status = filters.status as CaseStatus;
    if (filters.caseType) where.caseType = filters.caseType as CaseType;
    if (filters.priority) where.priority = filters.priority as CasePriority;
    if (filters.assignedUserId) where.assignedUserId = filters.assignedUserId;

    const [cases, total] = await Promise.all([
      this.prisma.case.findMany({
        where,
        include: {
          assignedUser: {
            select: { id: true, email: true, profile: { select: { displayName: true } } },
          },
          createdBy: {
            select: { id: true, email: true, profile: { select: { displayName: true } } },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: safeLimit,
      }),
      this.prisma.case.count({ where }),
    ]);

    return {
      data: cases,
      meta: { total, page, limit: safeLimit, totalPages: Math.ceil(total / safeLimit) },
    };
  }

  async getCase(caseId: string) {
    const caseRecord = await this.prisma.case.findUnique({
      where: { id: caseId },
      include: {
        createdBy: {
          select: { id: true, email: true, profile: { select: { displayName: true } } },
        },
        assignedUser: {
          select: { id: true, email: true, profile: { select: { displayName: true } } },
        },
        assignedPartnerOrg: true,
        events: {
          orderBy: { createdAt: 'desc' },
          include: {
            actor: { select: { id: true, email: true, profile: { select: { displayName: true } } } },
          },
        },
        notes: {
          orderBy: { createdAt: 'desc' },
          include: {
            author: { select: { id: true, email: true, profile: { select: { displayName: true } } } },
          },
        },
        assignments: {
          orderBy: { assignedAt: 'desc' },
        },
      },
    });

    if (!caseRecord) throw new NotFoundException('Case not found');
    return caseRecord;
  }

  async assignCase(caseId: string, userId: string, dto: AssignCaseDto) {
    const caseRecord = await this.prisma.case.findUnique({
      where: { id: caseId },
    });
    if (!caseRecord) throw new NotFoundException('Case not found');

    return this.prisma.$transaction(async (tx) => {
      const assignment = await tx.assignment.create({
        data: {
          caseId,
          assignedToType: dto.assignedToType,
          assignedToId: dto.assignedToId,
          assignedByUserId: userId,
          dueAt: dto.dueAt ? new Date(dto.dueAt) : undefined,
          slaPolicyId: dto.slaPolicyId,
        },
      });

      const updateData: Prisma.CaseUpdateInput = {
        status: CaseStatus.ASSIGNED,
      };

      if (dto.assignedToType === 'user') {
        updateData.assignedUser = { connect: { id: dto.assignedToId } };
      } else if (dto.assignedToType === 'partner_org') {
        updateData.assignedPartnerOrg = { connect: { id: dto.assignedToId } };
      }

      await tx.case.update({ where: { id: caseId }, data: updateData });

      await tx.caseEvent.create({
        data: {
          caseId,
          eventType: 'assigned',
          actorUserId: userId,
          payloadJson: {
            assignedToType: dto.assignedToType,
            assignedToId: dto.assignedToId,
            assignmentId: assignment.id,
          },
        },
      });

      return assignment;
    });
  }

  async addEvent(caseId: string, userId: string, dto: AddEventDto) {
    const caseRecord = await this.prisma.case.findUnique({
      where: { id: caseId },
    });
    if (!caseRecord) throw new NotFoundException('Case not found');

    return this.prisma.caseEvent.create({
      data: {
        caseId,
        eventType: dto.eventType,
        actorUserId: userId,
        payloadJson: dto.payloadJson,
      },
    });
  }

  async addNote(caseId: string, userId: string, dto: AddNoteDto) {
    const caseRecord = await this.prisma.case.findUnique({
      where: { id: caseId },
    });
    if (!caseRecord) throw new NotFoundException('Case not found');

    return this.prisma.caseNote.create({
      data: {
        caseId,
        authorUserId: userId,
        body: dto.body,
        visibility: dto.visibility as VisibilityScope,
      },
    });
  }

  async updateCase(caseId: string, userId: string, dto: UpdateCaseDto) {
    const caseRecord = await this.prisma.case.findUnique({
      where: { id: caseId },
    });
    if (!caseRecord) throw new NotFoundException('Case not found');

    const statusChanged =
      dto.status !== undefined && dto.status !== caseRecord.status;

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.case.update({
        where: { id: caseId },
        data: {
          ...(dto.status && { status: dto.status as CaseStatus }),
          ...(dto.priority && { priority: dto.priority as CasePriority }),
          ...(dto.severity && { severity: dto.severity as CaseSeverity }),
          ...(dto.assignedTeam !== undefined && { assignedTeam: dto.assignedTeam }),
          ...(dto.status === CaseStatus.RESOLVED && { resolvedAt: new Date() }),
        },
      });

      if (statusChanged) {
        await tx.caseEvent.create({
          data: {
            caseId,
            eventType: 'status_changed',
            actorUserId: userId,
            payloadJson: {
              previousStatus: caseRecord.status,
              newStatus: dto.status,
            },
          },
        });
      }

      return result;
    });

    return updated;
  }
}
