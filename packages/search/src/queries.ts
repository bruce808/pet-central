interface ListingSearchParams {
  query?: string;
  petType?: string;
  breed?: string;
  location?: { lat: number; lon: number };
  radiusKm?: number;
  orgType?: string;
  minFee?: number;
  maxFee?: number;
  sex?: string;
  size?: string;
  temperament?: string[];
  availabilityStatus?: string;
  sortBy?: string;
  page?: number;
  limit?: number;
}

interface OrganizationSearchParams {
  query?: string;
  orgType?: string;
  location?: { lat: number; lon: number };
  radiusKm?: number;
  sortBy?: string;
  page?: number;
  limit?: number;
}

export function buildListingSearchQuery(params: ListingSearchParams): object {
  const must: object[] = [];
  const filter: object[] = [];

  if (params.query) {
    must.push({
      multi_match: {
        query: params.query,
        fields: ['title^3', 'summary', 'breed^2', 'petType'],
        fuzziness: 'AUTO',
      },
    });
  }

  if (params.petType) {
    filter.push({ term: { petType: params.petType } });
  }

  if (params.breed) {
    filter.push({ term: { breed: params.breed } });
  }

  if (params.sex) {
    filter.push({ term: { sex: params.sex } });
  }

  if (params.size) {
    filter.push({ term: { size: params.size } });
  }

  if (params.orgType) {
    filter.push({ term: { organizationType: params.orgType } });
  }

  if (params.availabilityStatus) {
    filter.push({ term: { availabilityStatus: params.availabilityStatus } });
  }

  if (params.temperament && params.temperament.length > 0) {
    filter.push({ terms: { temperament: params.temperament } });
  }

  if (params.minFee !== undefined || params.maxFee !== undefined) {
    const range: Record<string, number> = {};
    if (params.minFee !== undefined) range['gte'] = params.minFee;
    if (params.maxFee !== undefined) range['lte'] = params.maxFee;
    filter.push({ range: { feeAmount: range } });
  }

  if (params.location) {
    filter.push({
      geo_distance: {
        distance: `${params.radiusKm ?? 50}km`,
        location: { lat: params.location.lat, lon: params.location.lon },
      },
    });
  }

  filter.push({ term: { listingStatus: 'active' } });
  filter.push({ term: { moderationStatus: 'approved' } });

  const page = params.page ?? 1;
  const limit = params.limit ?? 20;

  const sort = buildListingSort(params.sortBy, params.location);

  return {
    query: {
      bool: {
        ...(must.length > 0 ? { must } : { must: [{ match_all: {} }] }),
        filter,
      },
    },
    sort,
    from: (page - 1) * limit,
    size: limit,
  };
}

function buildListingSort(
  sortBy?: string,
  location?: { lat: number; lon: number },
): object[] {
  switch (sortBy) {
    case 'price_asc':
      return [{ feeAmount: { order: 'asc' } }];
    case 'price_desc':
      return [{ feeAmount: { order: 'desc' } }];
    case 'newest':
      return [{ publishedAt: { order: 'desc' } }];
    case 'trust_score':
      return [{ trustScore: { order: 'desc' } }];
    case 'distance':
      if (location) {
        return [
          {
            _geo_distance: {
              location: { lat: location.lat, lon: location.lon },
              order: 'asc',
              unit: 'km',
            },
          },
        ];
      }
      return [{ publishedAt: { order: 'desc' } }];
    default:
      return [{ _score: { order: 'desc' } }, { publishedAt: { order: 'desc' } }];
  }
}

export function buildOrganizationSearchQuery(
  params: OrganizationSearchParams,
): object {
  const must: object[] = [];
  const filter: object[] = [];

  if (params.query) {
    must.push({
      multi_match: {
        query: params.query,
        fields: ['name^3', 'description'],
        fuzziness: 'AUTO',
      },
    });
  }

  if (params.orgType) {
    filter.push({ term: { organizationType: params.orgType } });
  }

  if (params.location) {
    filter.push({
      geo_distance: {
        distance: `${params.radiusKm ?? 50}km`,
        location: { lat: params.location.lat, lon: params.location.lon },
      },
    });
  }

  filter.push({ term: { status: 'active' } });

  const page = params.page ?? 1;
  const limit = params.limit ?? 20;

  const sort = buildOrgSort(params.sortBy, params.location);

  return {
    query: {
      bool: {
        ...(must.length > 0 ? { must } : { must: [{ match_all: {} }] }),
        filter,
      },
    },
    sort,
    from: (page - 1) * limit,
    size: limit,
  };
}

function buildOrgSort(
  sortBy?: string,
  location?: { lat: number; lon: number },
): object[] {
  switch (sortBy) {
    case 'trust_score':
      return [{ trustScore: { order: 'desc' } }];
    case 'review_score':
      return [{ reviewScore: { order: 'desc' } }];
    case 'distance':
      if (location) {
        return [
          {
            _geo_distance: {
              location: { lat: location.lat, lon: location.lon },
              order: 'asc',
              unit: 'km',
            },
          },
        ];
      }
      return [{ trustScore: { order: 'desc' } }];
    default:
      return [{ _score: { order: 'desc' } }, { trustScore: { order: 'desc' } }];
  }
}
