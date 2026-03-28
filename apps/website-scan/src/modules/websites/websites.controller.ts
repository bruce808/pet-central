import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { WebsitesService } from './websites.service';

@Controller('websites')
export class WebsitesController {
  constructor(private readonly websitesService: WebsitesService) {}

  @Post()
  async createWebsite(@Body() body: Record<string, any>) {
    return this.websitesService.create(body);
  }

  @Get()
  async listWebsites(@Query() query: Record<string, any>) {
    return this.websitesService.list(query);
  }

  @Get(':id')
  async getWebsite(@Param('id') id: string) {
    return this.websitesService.findById(id);
  }

  @Patch(':id')
  async updateWebsite(
    @Param('id') id: string,
    @Body() body: Record<string, any>,
  ) {
    return this.websitesService.update(id, body);
  }

  @Get(':id/scans')
  async getWebsiteScans(
    @Param('id') id: string,
    @Query() query: Record<string, any>,
  ) {
    return this.websitesService.getScans(id, query);
  }
}
