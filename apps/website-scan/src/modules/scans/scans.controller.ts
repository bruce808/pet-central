import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ScansService } from './scans.service';
import { ScanOrchestratorService } from './scan-orchestrator.service';

@Controller('scans')
export class ScansController {
  constructor(
    private readonly scansService: ScansService,
    private readonly orchestrator: ScanOrchestratorService,
  ) {}

  @Post()
  async startScan(@Body() body: Record<string, any>) {
    if (body.sync) {
      return this.orchestrator.startScanSync(
        body.websiteId,
        body.scanType,
        body.triggerType,
        body.notes,
      );
    }
    return this.orchestrator.startScan(
      body.websiteId,
      body.scanType,
      body.triggerType,
      body.notes,
    );
  }

  @Get()
  async listScans(@Query() query: Record<string, any>) {
    return this.scansService.list(query);
  }

  @Get(':id')
  async getScan(@Param('id') id: string) {
    return this.scansService.findById(id);
  }

  @Get(':id/statistics')
  async getScanStatistics(@Param('id') id: string) {
    return this.scansService.getStatistics(id);
  }

  @Get(':id/pages')
  async getScanPages(
    @Param('id') id: string,
    @Query() query: Record<string, any>,
  ) {
    return this.scansService.getPages(id, query);
  }

  @Get(':id/entities')
  async getScanEntities(@Param('id') id: string) {
    return this.scansService.getEntities(id);
  }

  @Get(':id/animal-listings')
  async getScanAnimalListings(
    @Param('id') id: string,
    @Query() query: Record<string, any>,
  ) {
    return this.scansService.getAnimalListings(id, query);
  }
}
