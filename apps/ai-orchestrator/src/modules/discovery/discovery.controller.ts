import { Controller, Post, Get, Body, Query } from '@nestjs/common';
import { DiscoveryService } from './discovery.service';

@Controller('discovery')
export class DiscoveryController {
  constructor(private readonly discoveryService: DiscoveryService) {}

  @Post('scan')
  scan(
    @Body()
    body: {
      sourceUrl?: string;
      sourceContent?: string;
      entityType: string;
    },
  ) {
    return this.discoveryService.scan(body);
  }

  @Post('batch-scan')
  batchScan(
    @Body()
    body: {
      sources: Array<{ url: string; entityType: string }>;
    },
  ) {
    return this.discoveryService.batchScan(body.sources);
  }

  @Get('entities')
  getEntities(
    @Query('entityType') entityType?: string,
    @Query('matchStatus') matchStatus?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.discoveryService.getEntities({
      entityType,
      matchStatus,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
  }
}
