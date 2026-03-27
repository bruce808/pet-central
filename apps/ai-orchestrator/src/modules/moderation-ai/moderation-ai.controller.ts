import { Controller, Post, Body } from '@nestjs/common';
import { ModerationAIService } from './moderation-ai.service';

@Controller('moderation')
export class ModerationAIController {
  constructor(private readonly moderationAIService: ModerationAIService) {}

  @Post('analyze')
  analyze(
    @Body()
    body: {
      content: string;
      contentType: string;
      policies?: string[];
    },
  ) {
    return this.moderationAIService.analyze(body);
  }

  @Post('batch-analyze')
  batchAnalyze(
    @Body()
    body: {
      items: Array<{ id: string; content: string; contentType: string }>;
    },
  ) {
    return this.moderationAIService.batchAnalyze(body.items);
  }
}
