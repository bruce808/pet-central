import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ListingsService } from './listings.service';
import { JwtAuthGuard } from '../../common/guards/auth.guard';
import {
  CurrentUser,
  Public,
} from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '@pet-central/auth';

@Controller()
@UseGuards(JwtAuthGuard)
export class ListingsController {
  constructor(private readonly listingsService: ListingsService) {}

  @Public()
  @Get('listings')
  async getListings(@Query() query: Record<string, any>) {
    return this.listingsService.getListings(query);
  }

  @Public()
  @Get('listings/:id')
  async getListing(@Param('id') id: string) {
    return this.listingsService.getListing(id);
  }

  @Post('vendor/listings')
  async createListing(
    @CurrentUser() user: JwtPayload,
    @Body() body: Record<string, any>,
  ) {
    return this.listingsService.createListing(user.sub, body);
  }

  @Patch('vendor/listings/:id')
  async updateListing(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() body: Record<string, any>,
  ) {
    return this.listingsService.updateListing(id, user.sub, body);
  }

  @Post('vendor/listings/:id/publish')
  async publishListing(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.listingsService.publishListing(id, user.sub);
  }

  @Post('vendor/pets')
  async createPet(
    @CurrentUser() user: JwtPayload,
    @Body() body: Record<string, any>,
  ) {
    return this.listingsService.createPet(user.sub, body);
  }

  @Patch('vendor/pets/:id')
  async updatePet(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() body: Record<string, any>,
  ) {
    return this.listingsService.updatePet(id, user.sub, body);
  }

  @Post('vendor/pets/:id/media')
  async addMedia(
    @CurrentUser() user: JwtPayload,
    @Param('id') petId: string,
    @Body() body: Record<string, any>,
  ) {
    return this.listingsService.addMedia(petId, user.sub, body);
  }

  @Delete('vendor/pets/:id/media/:mediaId')
  async removeMedia(
    @CurrentUser() user: JwtPayload,
    @Param('id') petId: string,
    @Param('mediaId') mediaId: string,
  ) {
    return this.listingsService.removeMedia(petId, mediaId, user.sub);
  }
}
