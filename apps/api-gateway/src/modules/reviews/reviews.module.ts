import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';

@Module({
  imports: [BullModule.registerQueue({ name: 'moderation' })],
  controllers: [ReviewsController],
  providers: [ReviewsService],
})
export class ReviewsModule {}
