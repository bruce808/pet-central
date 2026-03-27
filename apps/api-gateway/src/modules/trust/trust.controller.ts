import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { TrustService } from './trust.service';
import { JwtAuthGuard } from '../../common/guards/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import {
  CurrentUser,
  Public,
  Roles,
} from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '@pet-central/auth';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class TrustController {
  constructor(private readonly trustService: TrustService) {}

  @Post('admin/organizations/:id/badges')
  @Roles('trust_analyst', 'admin')
  async assignBadge(
    @CurrentUser() user: JwtPayload,
    @Param('id') orgId: string,
    @Body() body: { badgeCode: string; expiresAt?: string },
  ) {
    return this.trustService.assignBadge(
      orgId,
      user.sub,
      body.badgeCode,
      body.expiresAt ? new Date(body.expiresAt) : undefined,
    );
  }

  @Delete('admin/organizations/:id/badges/:badgeId')
  @Roles('trust_analyst', 'admin')
  async removeBadge(
    @CurrentUser() user: JwtPayload,
    @Param('id') orgId: string,
    @Param('badgeId') badgeId: string,
  ) {
    return this.trustService.removeBadge(orgId, badgeId, user.sub);
  }

  @Post('admin/organizations/:id/verification/decision')
  @Roles('trust_analyst', 'admin')
  async makeVerificationDecision(
    @CurrentUser() user: JwtPayload,
    @Param('id') orgId: string,
    @Body()
    body: {
      verificationId: string;
      status: string;
      notesInternal?: string;
    },
  ) {
    return this.trustService.makeVerificationDecision(user.sub, {
      orgId,
      ...body,
    });
  }

  @Get('admin/organizations/:id/trust-profile')
  @Roles('trust_analyst', 'admin')
  async getTrustProfile(@Param('id') orgId: string) {
    return this.trustService.getTrustProfile(orgId);
  }

  @Public()
  @Get('organizations/:id/badges')
  async getPublicBadges(@Param('id') orgId: string) {
    return this.trustService.getPublicBadges(orgId);
  }
}
