import { Controller, Get, Post, Param } from '@nestjs/common';
import { QualityChecksService } from './quality-checks.service';

@Controller('quality-checks')
export class QualityChecksController {
  constructor(private readonly qualityChecksService: QualityChecksService) {}

  @Get('scan/:scanId')
  async getChecks(@Param('scanId') scanId: string) {
    return this.qualityChecksService.getChecks(scanId);
  }

  @Get('scan/:scanId/summary')
  async getSummary(@Param('scanId') scanId: string) {
    return this.qualityChecksService.getSummary(scanId);
  }

  @Post('scan/:scanId/run')
  async runChecks(@Param('scanId') scanId: string) {
    return this.qualityChecksService.runChecks(scanId);
  }
}
