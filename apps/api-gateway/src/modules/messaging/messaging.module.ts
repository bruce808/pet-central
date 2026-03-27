import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { MessagingController } from './messaging.controller';
import { MessagingService } from './messaging.service';

@Module({
  imports: [BullModule.registerQueue({ name: 'moderation' })],
  controllers: [MessagingController],
  providers: [MessagingService],
  exports: [MessagingService],
})
export class MessagingModule {}
