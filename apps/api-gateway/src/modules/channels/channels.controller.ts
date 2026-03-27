import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ChannelsService } from './channels.service';
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
export class ChannelsController {
  constructor(private readonly channelsService: ChannelsService) {}

  @Public()
  @Post('channel/resolve-origin')
  async resolveOrigin(
    @Body()
    body: {
      channelType: string;
      originPartnerOrgId?: string;
      originDomain?: string;
      originLocationName?: string;
      originLocationAddress?: string;
    },
  ) {
    return this.channelsService.resolveOrigin(body);
  }

  @Get('channel/:id')
  async getChannelOrigin(@Param('id') id: string) {
    return this.channelsService.getChannelOrigin(id);
  }

  @Post('referrals')
  async createReferral(
    @CurrentUser() user: JwtPayload,
    @Body()
    body: {
      channelOriginId: string;
      referralType: string;
      referredPartnerOrgId: string;
      relatedListingId?: string;
      userId?: string;
      organizationId?: string;
    },
  ) {
    return this.channelsService.createReferral(user.sub, body);
  }

  @Get('admin/channels')
  @Roles('admin')
  async listChannelOrigins(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.channelsService.listChannelOrigins(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Post('admin/channels')
  @Roles('admin')
  async createChannelOrigin(
    @Body()
    body: {
      channelType: string;
      originPartnerOrgId?: string;
      originDomain?: string;
      originLocationName?: string;
      originLocationAddress?: string;
      attributionRulesJson?: Record<string, any>;
    },
  ) {
    return this.channelsService.createChannelOrigin(body);
  }
}
