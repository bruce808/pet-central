import {
  Controller,
  Post,
  Body,
  UseGuards,
} from '@nestjs/common';
import { UploadsService } from './uploads.service';
import { JwtAuthGuard } from '../../common/guards/auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '@pet-central/auth';

@Controller()
@UseGuards(JwtAuthGuard)
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post('uploads/signed-url')
  async getSignedUploadUrl(
    @CurrentUser() user: JwtPayload,
    @Body()
    body: {
      fileName: string;
      contentType: string;
      purpose: 'pet-media' | 'document' | 'avatar' | 'attachment';
    },
  ) {
    return this.uploadsService.getSignedUploadUrl(user.sub, body);
  }
}
