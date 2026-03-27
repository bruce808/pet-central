import { Module } from '@nestjs/common';
import { ModerationAIController } from './moderation-ai.controller';
import { ModerationAIService } from './moderation-ai.service';

@Module({
  controllers: [ModerationAIController],
  providers: [ModerationAIService],
  exports: [ModerationAIService],
})
export class ModerationAIModule {}
