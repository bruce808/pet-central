export const LISTING_INDEX = 'pet_listings';
export const ORGANIZATION_INDEX = 'organizations';
export const RESOURCE_INDEX = 'resources';

export const LISTING_INDEX_MAPPING = {
  mappings: {
    properties: {
      title: {
        type: 'text' as const,
        fields: { keyword: { type: 'keyword' as const } },
      },
      summary: { type: 'text' as const },
      petType: { type: 'keyword' as const },
      breed: { type: 'keyword' as const },
      sex: { type: 'keyword' as const },
      size: { type: 'keyword' as const },
      location: { type: 'geo_point' as const },
      city: { type: 'keyword' as const },
      region: { type: 'keyword' as const },
      country: { type: 'keyword' as const },
      feeAmount: { type: 'float' as const },
      availabilityStatus: { type: 'keyword' as const },
      listingStatus: { type: 'keyword' as const },
      organizationType: { type: 'keyword' as const },
      trustScore: { type: 'float' as const },
      reviewScore: { type: 'float' as const },
      moderationStatus: { type: 'keyword' as const },
      publishedAt: { type: 'date' as const },
      temperament: { type: 'keyword' as const },
    },
  },
};

export const ORGANIZATION_INDEX_MAPPING = {
  mappings: {
    properties: {
      name: {
        type: 'text' as const,
        fields: { keyword: { type: 'keyword' as const } },
      },
      organizationType: { type: 'keyword' as const },
      description: { type: 'text' as const },
      location: { type: 'geo_point' as const },
      city: { type: 'keyword' as const },
      region: { type: 'keyword' as const },
      country: { type: 'keyword' as const },
      trustScore: { type: 'float' as const },
      reviewScore: { type: 'float' as const },
      responseRate: { type: 'float' as const },
      status: { type: 'keyword' as const },
      badges: { type: 'keyword' as const },
    },
  },
};
