import { Controller, Post, Body } from '@nestjs/common';
import { CorrespondenceService } from './correspondence.service';

@Controller('correspondence')
export class CorrespondenceController {
  constructor(
    private readonly correspondenceService: CorrespondenceService,
  ) {}

  @Post('draft')
  draft(
    @Body()
    body: {
      relatedEntityType: string;
      relatedEntityId: string;
      runType: string;
      instructions?: string;
    },
  ) {
    return this.correspondenceService.draft(body);
  }

  @Post('summarize')
  summarize(
    @Body()
    body: {
      entityType: 'conversation' | 'case';
      entityId: string;
    },
  ) {
    return this.correspondenceService.summarize(body.entityType, body.entityId);
  }

  @Post('classify')
  classify(
    @Body()
    body: {
      messageText: string;
      context?: Record<string, unknown>;
    },
  ) {
    return this.correspondenceService.classify(
      body.messageText,
      body.context,
    );
  }
}
