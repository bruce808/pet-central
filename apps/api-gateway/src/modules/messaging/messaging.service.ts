import {
  Injectable,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../../common/prisma.service';
import { ParticipantRole, MessageType } from '@pet-central/database';
import {
  checkRateLimit,
  checkForSpam,
  checkMessageSafety,
} from '@pet-central/messaging';

interface CreateConversationDto {
  organizationId: string;
  listingId?: string;
  initialMessage: string;
}

interface SendMessageDto {
  bodyText: string;
  messageType?: string;
}

@Injectable()
export class MessagingService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('moderation') private readonly moderationQueue: Queue,
  ) {}

  async createConversation(userId: string, dto: CreateConversationDto) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });

    const accountAgeDays = Math.floor(
      (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (accountAgeDays < 30) {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const conversationsToday = await this.prisma.conversation.count({
        where: { createdByUserId: userId, createdAt: { gte: todayStart } },
      });

      if (conversationsToday >= 10) {
        throw new BadRequestException(
          'Daily conversation limit reached. Please try again tomorrow.',
        );
      }
    }

    const orgAdmin = await this.prisma.organizationMember.findFirst({
      where: { organizationId: dto.organizationId, membershipRole: 'ADMIN' },
    });

    const conversation = await this.prisma.$transaction(async (tx) => {
      const convo = await tx.conversation.create({
        data: {
          createdByUserId: userId,
          organizationId: dto.organizationId,
          listingId: dto.listingId,
        },
      });

      await tx.conversationParticipant.createMany({
        data: [
          {
            conversationId: convo.id,
            userId,
            participantRole: ParticipantRole.INITIATOR,
          },
          ...(orgAdmin
            ? [
                {
                  conversationId: convo.id,
                  userId: orgAdmin.userId,
                  participantRole: ParticipantRole.RESPONDER,
                },
              ]
            : []),
        ],
      });

      const message = await tx.message.create({
        data: {
          conversationId: convo.id,
          senderUserId: userId,
          bodyText: dto.initialMessage,
          messageType: MessageType.TEXT,
        },
      });

      await tx.interaction.create({
        data: {
          userId,
          organizationId: dto.organizationId,
          listingId: dto.listingId,
          conversationId: convo.id,
          interactionType: 'INQUIRY',
        },
      });

      return { ...convo, messages: [message] };
    });

    await this.moderationQueue.add('moderate-message', {
      messageId: conversation.messages[0]!.id,
      contentType: 'message',
    });

    return conversation;
  }

  async getConversations(userId: string, page: number, limit: number) {
    const safeLimit = Math.min(limit, 100);
    const skip = (page - 1) * safeLimit;

    const where = {
      participants: { some: { userId } },
    };

    const [conversations, total] = await Promise.all([
      this.prisma.conversation.findMany({
        where,
        include: {
          organization: {
            select: { id: true, publicName: true },
          },
          listing: {
            select: { id: true, title: true },
          },
          messages: {
            orderBy: { createdAt: 'desc' as const },
            take: 1,
            select: {
              id: true,
              bodyText: true,
              senderUserId: true,
              createdAt: true,
            },
          },
          participants: {
            where: { userId: { not: userId } },
            select: { userId: true, participantRole: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: safeLimit,
      }),
      this.prisma.conversation.count({ where }),
    ]);

    const myParticipants = await this.prisma.conversationParticipant.findMany({
      where: {
        userId,
        conversationId: { in: conversations.map((c) => c.id) },
      },
      select: { conversationId: true, lastReadAt: true },
    });
    const lastReadMap = new Map(
      myParticipants.map((p) => [p.conversationId, p.lastReadAt]),
    );

    const unreadCounts = await Promise.all(
      conversations.map((c) => {
        const lastRead = lastReadMap.get(c.id);
        return this.prisma.message.count({
          where: {
            conversationId: c.id,
            senderUserId: { not: userId },
            ...(lastRead ? { createdAt: { gt: lastRead } } : {}),
          },
        });
      }),
    );

    const data = conversations.map((c, i) => ({
      ...c,
      unreadCount: unreadCounts[i],
    }));

    return {
      data,
      meta: { total, page, limit: safeLimit, totalPages: Math.ceil(total / safeLimit) },
    };
  }

  async getMessages(
    conversationId: string,
    userId: string,
    page: number,
    limit: number,
  ) {
    await this.checkParticipant(conversationId, userId);

    const safeLimit = Math.min(limit, 100);
    const skip = (page - 1) * safeLimit;

    const [messages, total] = await Promise.all([
      this.prisma.message.findMany({
        where: { conversationId },
        include: {
          sender: {
            select: { id: true, email: true, profile: { select: { displayName: true, avatarUrl: true } } },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: safeLimit,
      }),
      this.prisma.message.count({ where: { conversationId } }),
    ]);

    await this.prisma.conversationParticipant.update({
      where: { conversationId_userId: { conversationId, userId } },
      data: { lastReadAt: new Date() },
    });

    return {
      data: messages,
      meta: { total, page, limit: safeLimit, totalPages: Math.ceil(total / safeLimit) },
    };
  }

  async sendMessage(
    conversationId: string,
    userId: string,
    dto: SendMessageDto,
  ) {
    const participant = await this.checkParticipant(conversationId, userId);

    if (participant.isBlocked) {
      throw new ForbiddenException('You are blocked from this conversation');
    }

    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });
    const accountAgeDays = Math.floor(
      (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24),
    );

    const oneMinuteAgo = new Date(Date.now() - 60_000);
    const oneHourAgo = new Date(Date.now() - 3_600_000);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [messagesLastMinute, messagesLastHour, conversationsToday] =
      await Promise.all([
        this.prisma.message.count({
          where: { senderUserId: userId, createdAt: { gte: oneMinuteAgo } },
        }),
        this.prisma.message.count({
          where: { senderUserId: userId, createdAt: { gte: oneHourAgo } },
        }),
        this.prisma.conversation.count({
          where: { createdByUserId: userId, createdAt: { gte: todayStart } },
        }),
      ]);

    const rateLimitResult = checkRateLimit({
      messagesLastMinute,
      messagesLastHour,
      conversationsToday,
      accountAgeDays,
      trustLevel: 'default',
    });

    if (!rateLimitResult.allowed) {
      throw new BadRequestException(
        rateLimitResult.reason || 'Rate limit exceeded',
      );
    }

    const twentyFourHoursAgo = new Date(Date.now() - 86_400_000);
    const messagesSentLast24h = await this.prisma.message.count({
      where: { senderUserId: userId, createdAt: { gte: twentyFourHoursAgo } },
    });

    const spamResult = checkForSpam({
      text: dto.bodyText,
      senderAccountAgeDays: accountAgeDays,
      messagesSentLast24h,
      containsLinks: /https?:\/\//.test(dto.bodyText),
      containsContactInfo:
        /[\w.-]+@[\w.-]+\.\w+/.test(dto.bodyText) ||
        /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/.test(dto.bodyText),
      recipientCount24h: conversationsToday,
    });

    if (spamResult.isSpam) {
      throw new BadRequestException('Message flagged as spam');
    }

    const message = await this.prisma.message.create({
      data: {
        conversationId,
        senderUserId: userId,
        bodyText: dto.bodyText,
        messageType: (dto.messageType as MessageType) || MessageType.TEXT,
        ...(spamResult.requiresReview && { moderationStatus: 'REQUIRES_REVIEW' }),
        riskScore: spamResult.score,
      },
      include: {
        sender: {
          select: { id: true, email: true, profile: { select: { displayName: true, avatarUrl: true } } },
        },
      },
    });

    await this.moderationQueue.add('moderate-message', {
      messageId: message.id,
      contentType: 'message',
    });

    const safetyWarnings = checkMessageSafety(dto.bodyText);
    return { message, safetyWarnings };
  }

  private async checkParticipant(conversationId: string, userId: string) {
    const participant =
      await this.prisma.conversationParticipant.findUnique({
        where: { conversationId_userId: { conversationId, userId } },
      });

    if (!participant) {
      throw new ForbiddenException('You are not a participant in this conversation');
    }

    return participant;
  }
}
