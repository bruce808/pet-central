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
import { CasesService } from './cases.service';
import { JwtAuthGuard } from '../../common/guards/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import {
  CurrentUser,
  Roles,
} from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '@pet-central/auth';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class CasesController {
  constructor(private readonly casesService: CasesService) {}

  @Post('reports')
  async createCase(
    @CurrentUser() user: JwtPayload,
    @Body()
    body: {
      caseType: string;
      sourceType: string;
      sourceId: string;
      description: string;
      region?: string;
    },
  ) {
    return this.casesService.createCase(user.sub, body);
  }

  @Get('admin/cases')
  @Roles('support_agent', 'trust_analyst', 'moderator', 'admin')
  async getCases(
    @Query('status') status?: string,
    @Query('caseType') caseType?: string,
    @Query('priority') priority?: string,
    @Query('assignedUserId') assignedUserId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.casesService.getCases(
      { status, caseType, priority, assignedUserId },
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Get('admin/cases/:id')
  @Roles('support_agent', 'trust_analyst', 'moderator', 'admin')
  async getCase(@Param('id') id: string) {
    return this.casesService.getCase(id);
  }

  @Post('admin/cases/:id/assign')
  @Roles('support_agent', 'trust_analyst', 'moderator', 'admin')
  async assignCase(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body()
    body: {
      assignedToType: string;
      assignedToId: string;
      dueAt?: string;
      slaPolicyId?: string;
    },
  ) {
    return this.casesService.assignCase(id, user.sub, body);
  }

  @Post('admin/cases/:id/events')
  @Roles('support_agent', 'trust_analyst', 'moderator', 'admin')
  async addEvent(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() body: { eventType: string; payloadJson?: Record<string, any> },
  ) {
    return this.casesService.addEvent(id, user.sub, body);
  }

  @Post('admin/cases/:id/notes')
  @Roles('support_agent', 'trust_analyst', 'moderator', 'admin')
  async addNote(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() body: { body: string; visibility: string },
  ) {
    return this.casesService.addNote(id, user.sub, body);
  }

  @Patch('admin/cases/:id')
  @Roles('support_agent', 'trust_analyst', 'moderator', 'admin')
  async updateCase(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body()
    body: {
      status?: string;
      priority?: string;
      severity?: string;
      assignedTeam?: string;
    },
  ) {
    return this.casesService.updateCase(id, user.sub, body);
  }
}
