import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ScansController } from './scans.controller';
import { ScansService } from './scans.service';
import { ScanOrchestratorService } from './scan-orchestrator.service';
import { PagesModule } from '../pages/pages.module';
import { ExtractionModule } from '../extraction/extraction.module';
import { QualityChecksModule } from '../quality-checks/quality-checks.module';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'website-scan' }),
    PagesModule,
    ExtractionModule,
    QualityChecksModule,
  ],
  controllers: [ScansController],
  providers: [ScansService, ScanOrchestratorService],
  exports: [ScansService, ScanOrchestratorService],
})
export class ScansModule {}
