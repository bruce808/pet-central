import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ListingsController } from './listings.controller';
import { ListingsService } from './listings.service';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'moderation' }),
    BullModule.registerQueue({ name: 'search-index' }),
  ],
  controllers: [ListingsController],
  providers: [ListingsService],
  exports: [ListingsService],
})
export class ListingsModule {}
