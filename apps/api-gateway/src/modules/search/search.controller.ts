import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { SearchService } from './search.service';
import { JwtAuthGuard } from '../../common/guards/auth.guard';
import { Public } from '../../common/decorators/current-user.decorator';

@Controller('search')
@UseGuards(JwtAuthGuard)
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Public()
  @Get('listings')
  async searchListings(
    @Query('query') query?: string,
    @Query('petType') petType?: string,
    @Query('breed') breed?: string,
    @Query('locationLat') locationLat?: string,
    @Query('locationLon') locationLon?: string,
    @Query('radiusKm') radiusKm?: string,
    @Query('orgType') orgType?: string,
    @Query('minFee') minFee?: string,
    @Query('maxFee') maxFee?: string,
    @Query('sex') sex?: string,
    @Query('sizeCategory') sizeCategory?: string,
    @Query('temperament') temperament?: string,
    @Query('availabilityStatus') availabilityStatus?: string,
    @Query('sortBy') sortBy?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.searchService.searchListings({
      query,
      petType,
      breed,
      locationLat: locationLat ? parseFloat(locationLat) : undefined,
      locationLon: locationLon ? parseFloat(locationLon) : undefined,
      radiusKm: radiusKm ? parseFloat(radiusKm) : undefined,
      orgType,
      minFee: minFee ? parseFloat(minFee) : undefined,
      maxFee: maxFee ? parseFloat(maxFee) : undefined,
      sex,
      sizeCategory,
      temperament,
      availabilityStatus,
      sortBy,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Public()
  @Get('organizations')
  async searchOrganizations(
    @Query('query') query?: string,
    @Query('orgType') orgType?: string,
    @Query('locationLat') locationLat?: string,
    @Query('locationLon') locationLon?: string,
    @Query('radiusKm') radiusKm?: string,
    @Query('sortBy') sortBy?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.searchService.searchOrganizations({
      query,
      orgType,
      locationLat: locationLat ? parseFloat(locationLat) : undefined,
      locationLon: locationLon ? parseFloat(locationLon) : undefined,
      radiusKm: radiusKm ? parseFloat(radiusKm) : undefined,
      sortBy,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }
}
