import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AIController } from './ai.controller';
import { AIService } from './ai.service';

@Module({
  imports: [BullModule.registerQueue({ name: 'ai-enrichment' })],
  controllers: [AIController],
  providers: [AIService],
  exports: [AIService],
})
export class AIModule {}
