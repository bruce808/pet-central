import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { getDefaultProvider, DEFAULT_REGISTRY } from '@pet-central/ai-core';
import { AIChannelType, AIRunType, AIRunStatus } from '@pet-central/database';

interface DraftDto {
  relatedEntityType: string;
  relatedEntityId: string;
  runType: string;
  instructions?: string;
}

@Injectable()
export class CorrespondenceService {
  private readonly logger = new Logger(CorrespondenceService.name);

  constructor(private readonly prisma: PrismaService) {}

  async draft(dto: DraftDto) {
    let entityContext: string;

    if (dto.relatedEntityType === 'conversation') {
      const conversation = await this.prisma.conversation.findUnique({
        where: { id: dto.relatedEntityId },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
            take: 50,
            include: { sender: { include: { profile: true } } },
          },
        },
      });

      if (!conversation) {
        throw new NotFoundException('Conversation not found');
      }

      entityContext = JSON.stringify({
        type: 'conversation',
        messages: conversation.messages.map((m) => ({
          sender: m.sender.profile?.displayName ?? 'Unknown',
          text: m.bodyText,
          timestamp: m.createdAt,
        })),
      });
    } else {
      const caseEntity = await this.prisma.case.findUnique({
        where: { id: dto.relatedEntityId },
        include: {
          events: { orderBy: { createdAt: 'asc' }, take: 50 },
          notes: { orderBy: { createdAt: 'asc' }, take: 20 },
        },
      });

      if (!caseEntity) {
        throw new NotFoundException('Case not found');
      }

      entityContext = JSON.stringify({
        type: 'case',
        caseType: caseEntity.caseType,
        priority: caseEntity.priority,
        status: caseEntity.status,
        events: caseEntity.events.map((e) => ({
          type: e.eventType,
          payload: e.payloadJson,
          timestamp: e.createdAt,
        })),
        notes: caseEntity.notes.map((n) => ({
          body: n.body,
          timestamp: n.createdAt,
        })),
      });
    }

    const template = DEFAULT_REGISTRY.get('correspondence-draft');
    const rendered = DEFAULT_REGISTRY.render('correspondence-draft', {
      correspondenceType: dto.runType,
      recipientInfo: dto.relatedEntityType,
      context: entityContext,
    });

    const provider = getDefaultProvider();
    const startTime = Date.now();
    const response = await provider.complete({
      systemPrompt: rendered.systemPrompt,
      messages: [{ role: 'user', content: rendered.userPrompt }],
    });
    const latencyMs = Date.now() - startTime;

    const confidenceScore = this.extractConfidence(response.content);

    const run = await this.prisma.aICorrespondenceRun.create({
      data: {
        relatedEntityType: dto.relatedEntityType,
        relatedEntityId: dto.relatedEntityId,
        runType: dto.runType as AIRunType,
        status: AIRunStatus.COMPLETED,
        inputRefJson: { instructions: dto.instructions, entityContext },
        outputRefJson: { draft: response.content, confidenceScore },
        confidenceScore,
        completedAt: new Date(),
      },
    });

    await this.prisma.aIInteraction.create({
      data: {
        channelType: AIChannelType.INTERNAL_ASSISTANT,
        promptVersion: template?.version ?? 'unknown',
        modelName: response.model,
        inputSummary: `Draft ${dto.runType} for ${dto.relatedEntityType}:${dto.relatedEntityId}`,
        outputSummary: response.content.substring(0, 500),
      },
    });

    this.logger.log(
      `Correspondence draft completed in ${latencyMs}ms, run=${run.id}`,
    );

    return {
      runId: run.id,
      draft: response.content,
      confidenceScore,
      status: AIRunStatus.COMPLETED,
    };
  }

  async summarize(entityType: 'conversation' | 'case', entityId: string) {
    let contextData: string;

    if (entityType === 'conversation') {
      const conversation = await this.prisma.conversation.findUnique({
        where: { id: entityId },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
            include: { sender: { include: { profile: true } } },
          },
          listing: { include: { pet: true } },
        },
      });

      if (!conversation) {
        throw new NotFoundException('Conversation not found');
      }

      contextData = JSON.stringify({
        type: conversation.conversationType,
        listing: conversation.listing
          ? {
              title: conversation.listing.title,
              petType: conversation.listing.pet.petType,
            }
          : null,
        messages: conversation.messages.map((m) => ({
          sender: m.sender.profile?.displayName ?? 'Unknown',
          text: m.bodyText,
          timestamp: m.createdAt,
        })),
      });
    } else {
      const caseEntity = await this.prisma.case.findUnique({
        where: { id: entityId },
        include: {
          events: { orderBy: { createdAt: 'asc' } },
          notes: { orderBy: { createdAt: 'asc' } },
        },
      });

      if (!caseEntity) {
        throw new NotFoundException('Case not found');
      }

      contextData = JSON.stringify({
        caseType: caseEntity.caseType,
        priority: caseEntity.priority,
        severity: caseEntity.severity,
        status: caseEntity.status,
        events: caseEntity.events.map((e) => ({
          type: e.eventType,
          payload: e.payloadJson,
          timestamp: e.createdAt,
        })),
        notes: caseEntity.notes.map((n) => ({
          body: n.body,
          visibility: n.visibility,
          timestamp: n.createdAt,
        })),
      });
    }

    const template = DEFAULT_REGISTRY.get('case-summary');
    const rendered = DEFAULT_REGISTRY.render('case-summary', {
      caseDetails: entityType,
      events: contextData,
      notes: '',
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
        channelType: AIChannelType.INTERNAL_ASSISTANT,
        promptVersion: template?.version ?? 'unknown',
        modelName: response.model,
        inputSummary: `Summarize ${entityType}:${entityId}`,
        outputSummary: response.content.substring(0, 500),
      },
    });

    this.logger.log(
      `Summary for ${entityType}:${entityId} completed in ${latencyMs}ms`,
    );

    return {
      entityType,
      entityId,
      summary: response.content,
    };
  }

  async classify(
    messageText: string,
    context?: Record<string, unknown>,
  ) {
    const provider = getDefaultProvider();
    const systemPrompt =
      'You are a message classifier for a pet services platform. Classify the incoming message into one of these categories: inquiry, complaint, follow-up, spam, urgent. Respond with JSON: { "category": "...", "confidence": 0.0-1.0, "reasoning": "..." }';
    const userPrompt = `Classify this message:\n\n"${messageText}"${context ? `\n\nContext: ${JSON.stringify(context)}` : ''}`;

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
        channelType: AIChannelType.INTERNAL_ASSISTANT,
        promptVersion: 'classification-v1',
        modelName: response.model,
        inputSummary: messageText.substring(0, 200),
        outputSummary: response.content.substring(0, 500),
      },
    });

    this.logger.log(`Message classification completed in ${latencyMs}ms`);

    try {
      return JSON.parse(response.content);
    } catch {
      return {
        category: 'inquiry',
        confidence: 0.5,
        reasoning: response.content,
      };
    }
  }

  private extractConfidence(content: string): number {
    const match = content.match(/"confidence"\s*:\s*([\d.]+)/);
    return match?.[1] ? parseFloat(match[1]) : 0.75;
  }
}
