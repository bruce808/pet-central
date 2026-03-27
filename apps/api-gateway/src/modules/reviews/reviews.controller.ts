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
import { ReviewsService } from './reviews.service';
import { JwtAuthGuard } from '../../common/guards/auth.guard';
import {
  CurrentUser,
  Public,
} from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '@pet-central/auth';

@Controller()
@UseGuards(JwtAuthGuard)
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post('reviews')
  async createReview(
    @CurrentUser() user: JwtPayload,
    @Body() body: Record<string, any>,
  ) {
    return this.reviewsService.createReview(user.sub, body);
  }

  @Patch('reviews/:id')
  async updateReview(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() body: Record<string, any>,
  ) {
    return this.reviewsService.updateReview(id, user.sub, body);
  }

  @Post('reviews/:id/respond')
  async respondToReview(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() body: { responseText: string },
  ) {
    return this.reviewsService.respondToReview(id, user.sub, body);
  }

  @Post('reviews/:id/flag')
  async flagReview(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() body: { reasonCode: string; notes?: string },
  ) {
    return this.reviewsService.flagReview(id, user.sub, body);
  }

  @Public()
  @Get('organizations/:orgId/reviews')
  async getOrganizationReviews(
    @Param('orgId') orgId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.reviewsService.getOrganizationReviews(
      orgId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }
}
