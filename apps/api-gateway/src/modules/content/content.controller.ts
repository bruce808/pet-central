import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ContentService } from './content.service';
import { JwtAuthGuard } from '../../common/guards/auth.guard';
import {
  CurrentUser,
  Public,
} from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '@pet-central/auth';

@Controller()
@UseGuards(JwtAuthGuard)
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  @Public()
  @Get('resources')
  async getResources(
    @Query('type') type?: string,
    @Query('tags') tags?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.contentService.getResources(
      { type, tags },
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Public()
  @Get('resources/:slug')
  async getResourceBySlug(@Param('slug') slug: string) {
    return this.contentService.getResourceBySlug(slug);
  }

  @Post('vendor/resources')
  async createResource(
    @CurrentUser() user: JwtPayload,
    @Body()
    body: {
      resourceType: string;
      title: string;
      slug: string;
      bodyMarkdown: string;
      tagsJson?: any;
      organizationId?: string;
    },
  ) {
    return this.contentService.createResource(user.sub, body);
  }

  @Patch('vendor/resources/:id')
  async updateResource(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body()
    body: {
      title?: string;
      bodyMarkdown?: string;
      tagsJson?: any;
      status?: string;
    },
  ) {
    return this.contentService.updateResource(id, user.sub, body);
  }
}
