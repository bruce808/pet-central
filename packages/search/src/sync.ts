export interface IndexableDocument {
  id: string;
  [key: string]: unknown;
}

export function buildListingDocument(listing: Record<string, unknown>): IndexableDocument {
  return {
    id: listing['id'] as string,
    title: listing['title'],
    summary: listing['summary'],
    petType: listing['petType'],
    breed: listing['breed'],
    sex: listing['sex'],
    size: listing['size'],
    location: listing['location'],
    city: listing['city'],
    region: listing['region'],
    country: listing['country'],
    feeAmount: listing['feeAmount'],
    availabilityStatus: listing['availabilityStatus'],
    listingStatus: listing['listingStatus'],
    organizationType: listing['organizationType'],
    trustScore: listing['trustScore'],
    reviewScore: listing['reviewScore'],
    moderationStatus: listing['moderationStatus'],
    publishedAt: listing['publishedAt'],
    temperament: listing['temperament'],
  };
}

export function buildOrganizationDocument(org: Record<string, unknown>): IndexableDocument {
  return {
    id: org['id'] as string,
    name: org['name'],
    organizationType: org['organizationType'],
    description: org['description'],
    location: org['location'],
    city: org['city'],
    region: org['region'],
    country: org['country'],
    trustScore: org['trustScore'],
    reviewScore: org['reviewScore'],
    responseRate: org['responseRate'],
    status: org['status'],
    badges: org['badges'],
  };
}
