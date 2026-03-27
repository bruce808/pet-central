import { Module } from '@nestjs/common';
import { GuidanceController } from './guidance.controller';
import { GuidanceService } from './guidance.service';

@Module({
  controllers: [GuidanceController],
  providers: [GuidanceService],
  exports: [GuidanceService],
})
export class GuidanceModule {}
