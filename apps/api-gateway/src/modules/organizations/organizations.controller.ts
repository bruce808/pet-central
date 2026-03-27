import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { JwtAuthGuard } from '../../common/guards/auth.guard';
import { CurrentUser, Public } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '@pet-central/auth';

@Controller()
@UseGuards(JwtAuthGuard)
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Post('vendor/organizations')
  async create(
    @CurrentUser() user: JwtPayload,
    @Body() body: Record<string, any>,
  ) {
    return this.organizationsService.createOrganization(user.sub, body);
  }

  @Patch('vendor/organizations/:id')
  async update(
    @CurrentUser() user: JwtPayload,
    @Param('id') orgId: string,
    @Body() body: Record<string, any>,
  ) {
    return this.organizationsService.updateOrganization(orgId, user.sub, body);
  }

  @Public()
  @Get('organizations/:id')
  async getPublicProfile(@Param('id') orgId: string) {
    return this.organizationsService.getOrganization(orgId);
  }

  @Post('vendor/organizations/:id/documents')
  async uploadDocument(
    @CurrentUser() user: JwtPayload,
    @Param('id') orgId: string,
    @Body() body: Record<string, any>,
  ) {
    return this.organizationsService.uploadDocument(orgId, user.sub, body);
  }

  @Get('vendor/organizations/:id/members')
  async getMembers(
    @CurrentUser() user: JwtPayload,
    @Param('id') orgId: string,
  ) {
    await this.organizationsService.checkOrgAccess(orgId, user.sub);
    return this.organizationsService.getMembers(orgId);
  }

  @Post('vendor/organizations/:id/members')
  async addMember(
    @CurrentUser() user: JwtPayload,
    @Param('id') orgId: string,
    @Body() body: { email: string; role: string },
  ) {
    await this.organizationsService.checkOrgAccess(orgId, user.sub, 'admin');
    return this.organizationsService.addMember(orgId, body);
  }

  @Delete('vendor/organizations/:id/members/:memberId')
  @HttpCode(HttpStatus.OK)
  async removeMember(
    @CurrentUser() user: JwtPayload,
    @Param('id') orgId: string,
    @Param('memberId') memberId: string,
  ) {
    await this.organizationsService.checkOrgAccess(orgId, user.sub, 'admin');
    await this.organizationsService.removeMember(orgId, memberId);
    return { message: 'Member removed' };
  }
}
