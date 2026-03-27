import { Controller, Post, Body } from '@nestjs/common';
import { GuidanceService } from './guidance.service';

@Controller('guidance')
export class GuidanceController {
  constructor(private readonly guidanceService: GuidanceService) {}

  @Post('chat')
  chat(
    @Body()
    body: {
      message: string;
      sessionId?: string;
      context?: { petType?: string; breed?: string; location?: string };
    },
  ) {
    return this.guidanceService.chat(body);
  }

  @Post('explain-breed')
  explainBreed(@Body() body: { petType: string; breed: string }) {
    return this.guidanceService.explainBreed(body.petType, body.breed);
  }
}
