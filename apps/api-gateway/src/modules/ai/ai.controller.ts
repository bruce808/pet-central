import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { AIService } from './ai.service';
import { JwtAuthGuard } from '../../common/guards/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import {
  CurrentUser,
  Roles,
} from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '@pet-central/auth';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class AIController {
  constructor(private readonly aiService: AIService) {}

  @Post('ai/chat')
  async chat(
    @CurrentUser() user: JwtPayload,
    @Body()
    body: {
      message: string;
      sessionId?: string;
      channelType?: string;
      channelOriginId?: string;
    },
  ) {
    return this.aiService.chat(user.sub, body);
  }

  @Post('ai/recommendations')
  async getRecommendations(
    @CurrentUser() user: JwtPayload,
    @Body()
    body: {
      preferences: {
        petType?: string;
        breeds?: string[];
        sizeCategory?: string;
        ageRange?: { min?: number; max?: number };
        location?: string;
        [key: string]: any;
      };
      channelOriginId?: string;
    },
  ) {
    return this.aiService.getRecommendations(user.sub, body);
  }

  @Get('ai/sessions/:id')
  async getSession(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.aiService.getSession(id, user.sub);
  }

  @Post('correspondence/draft')
  @Roles('support_agent', 'trust_analyst', 'moderator', 'admin')
  async draftCorrespondence(
    @CurrentUser() user: JwtPayload,
    @Body()
    body: {
      relatedEntityType: string;
      relatedEntityId: string;
      runType: string;
      context?: Record<string, any>;
    },
  ) {
    return this.aiService.draftCorrespondence(user.sub, body);
  }

  @Post('correspondence/auto-handle')
  @Roles('support_agent', 'trust_analyst', 'moderator', 'admin')
  async autoHandleCorrespondence(
    @CurrentUser() user: JwtPayload,
    @Body()
    body: {
      relatedEntityType: string;
      relatedEntityId: string;
      runType: string;
    },
  ) {
    return this.aiService.autoHandleCorrespondence(user.sub, body);
  }

  @Get('correspondence/runs/:id')
  @Roles('support_agent', 'trust_analyst', 'moderator', 'admin')
  async getCorrespondenceRun(@Param('id') id: string) {
    return this.aiService.getCorrespondenceRun(id);
  }
}
