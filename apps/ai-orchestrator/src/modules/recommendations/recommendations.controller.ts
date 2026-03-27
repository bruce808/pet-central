import { Controller, Post, Body } from '@nestjs/common';
import { RecommendationsService } from './recommendations.service';

@Controller('recommendations')
export class RecommendationsController {
  constructor(
    private readonly recommendationsService: RecommendationsService,
  ) {}

  @Post('personalized')
  personalized(
    @Body()
    body: {
      preferences: {
        petType?: string;
        breeds?: string[];
        size?: string;
        temperament?: string[];
        location?: string;
        budget?: { min?: number; max?: number };
        householdInfo?: Record<string, unknown>;
      };
      limit?: number;
    },
  ) {
    return this.recommendationsService.personalized(
      body.preferences,
      body.limit,
    );
  }

  @Post('similar')
  similar(@Body() body: { listingId: string; limit?: number }) {
    return this.recommendationsService.similar(body.listingId, body.limit);
  }
}
