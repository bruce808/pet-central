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
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../../common/guards/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import {
  CurrentUser,
  Roles,
} from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '@pet-central/auth';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'moderator', 'trust_analyst', 'support_agent')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('admin/dashboard')
  async getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  @Get('admin/audit-log')
  async getAuditLogs(
    @Query('actorType') actorType?: string,
    @Query('actorId') actorId?: string,
    @Query('actionType') actionType?: string,
    @Query('targetType') targetType?: string,
    @Query('targetId') targetId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.getAuditLogs(
      { actorType, actorId, actionType, targetType, targetId, startDate, endDate },
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Post('admin/reviews/:id/moderate')
  async moderateReview(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() body: { action: string; reason?: string },
  ) {
    return this.adminService.moderateReview(id, user.sub, body);
  }

  @Post('admin/messages/:id/moderate')
  async moderateMessage(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() body: { action: string; reason?: string },
  ) {
    return this.adminService.moderateMessage(id, user.sub, body);
  }

  @Get('admin/users')
  async getUsers(
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('role') role?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.getUsers(
      { status, search, role },
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Patch('admin/users/:id/status')
  async updateUserStatus(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() body: { status: string; reason?: string },
  ) {
    return this.adminService.updateUserStatus(id, user.sub, body);
  }

  @Get('admin/moderation-queue')
  async getModerationQueue(
    @Query('contentType') contentType?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.getModerationQueue(
      contentType,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Get('admin/ai/correspondence-runs')
  async getCorrespondenceRuns(
    @Query('status') status?: string,
    @Query('runType') runType?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.getCorrespondenceRuns(
      { status, runType },
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Get('admin/ai/discovered-entities')
  async getDiscoveredEntities(
    @Query('entityType') entityType?: string,
    @Query('matchStatus') matchStatus?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.getDiscoveredEntities(
      { entityType, matchStatus },
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Patch('admin/ai/discovered-entities/:id')
  async updateDiscoveredEntity(
    @Param('id') id: string,
    @Body() body: { matchStatus: string; routedToTeam?: string },
  ) {
    return this.adminService.updateDiscoveredEntity(id, body);
  }
}
