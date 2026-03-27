import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../../common/guards/auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '@pet-central/auth';

@Controller()
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getProfile(@CurrentUser() user: JwtPayload) {
    return this.usersService.getProfile(user.sub);
  }

  @Patch('me')
  async updateProfile(
    @CurrentUser() user: JwtPayload,
    @Body() body: Record<string, any>,
  ) {
    return this.usersService.updateProfile(user.sub, body);
  }

  @Get('me/favorites')
  async getFavorites(
    @CurrentUser() user: JwtPayload,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.usersService.getFavorites(
      user.sub,
      parseInt(page || '1', 10),
      parseInt(limit || '20', 10),
    );
  }

  @Post('me/favorites')
  async addFavorite(
    @CurrentUser() user: JwtPayload,
    @Body() body: { listingId: string },
  ) {
    return this.usersService.addFavorite(user.sub, body.listingId);
  }

  @Delete('me/favorites/:id')
  @HttpCode(HttpStatus.OK)
  async removeFavorite(
    @CurrentUser() user: JwtPayload,
    @Param('id') favoriteId: string,
  ) {
    await this.usersService.removeFavorite(user.sub, favoriteId);
    return { message: 'Favorite removed' };
  }
}
