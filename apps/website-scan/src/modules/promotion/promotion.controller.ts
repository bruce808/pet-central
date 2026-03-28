import { Controller, Get, Post, Param, Body, Query } from '@nestjs/common';
import { PromotionService } from './promotion.service';

@Controller('promotion')
export class PromotionController {
  constructor(private readonly promotionService: PromotionService) {}

  @Post('scan/:scanId')
  async promoteScan(
    @Param('scanId') scanId: string,
    @Body() body: Record<string, any>,
  ) {
    return this.promotionService.promoteScan(scanId, body.approvedBy, body.notes);
  }

  @Get('batches')
  async listBatches(@Query() query: Record<string, any>) {
    return this.promotionService.listBatches(query);
  }

  @Get('batches/:id')
  async getBatch(@Param('id') id: string) {
    return this.promotionService.getBatch(id);
  }

  @Get('batches/:id/results')
  async getBatchResults(@Param('id') id: string) {
    return this.promotionService.getBatchResults(id);
  }
}
