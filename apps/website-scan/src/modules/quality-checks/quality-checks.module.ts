import { Module } from '@nestjs/common';
import { QualityChecksController } from './quality-checks.controller';
import { QualityChecksService } from './quality-checks.service';

@Module({
  controllers: [QualityChecksController],
  providers: [QualityChecksService],
  exports: [QualityChecksService],
})
export class QualityChecksModule {}
