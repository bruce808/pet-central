import { Worker, Job } from 'bullmq';
import type Redis from 'ioredis';
import { PrismaClient } from '@pet-central/database';
import {
  createSearchClient,
  LISTING_INDEX,
  ORGANIZATION_INDEX,
  buildListingDocument,
  buildOrganizationDocument,
} from '@pet-central/search';

const prisma = new PrismaClient();
const searchClient = createSearchClient();

interface SearchIndexJobData {
  id?: string;
}

type SearchIndexJobName =
  | 'index-listing'
  | 'index-organization'
  | 'remove-listing'
  | 'remove-organization'
  | 'reindex-all';

export function createSearchIndexWorker(connection: Redis): Worker<SearchIndexJobData, void, SearchIndexJobName> {
  return new Worker<SearchIndexJobData, void, SearchIndexJobName>(
    'search-index',
    async (job: Job<SearchIndexJobData, void, SearchIndexJobName>) => {
      try {
        switch (job.name) {
          case 'index-listing':
            await indexListing(job.data.id!);
            break;
          case 'index-organization':
            await indexOrganization(job.data.id!);
            break;
          case 'remove-listing':
            await removeListing(job.data.id!);
            break;
          case 'remove-organization':
            await removeOrganization(job.data.id!);
            break;
          case 'reindex-all':
            await reindexAll();
            break;
          default:
            console.warn(`[search-index] Unknown job name: ${job.name}`);
        }
      } catch (error) {
        console.error(
          `[search-index] Job ${job.name} failed for ${job.data.id ?? 'all'}:`,
          error,
        );
        throw error;
      }
    },
    { connection, concurrency: 3 },
  );
}

async function indexListing(id: string): Promise<void> {
  const listing = await prisma.petListing.findUniqueOrThrow({
    where: { id },
    include: {
      pet: {
        include: {
          organization: true,
          media: true,
        },
      },
    },
  });

  const doc = buildListingDocument({
    id: listing.id,
    title: listing.title,
    summary: listing.summary,
    petType: listing.pet.petType,
    breed: listing.pet.breedPrimary,
    sex: listing.pet.sex,
    size: listing.pet.sizeCategory,
    location:
      listing.latitude && listing.longitude
        ? { lat: listing.latitude, lon: listing.longitude }
        : undefined,
    city: listing.locationCity,
    region: listing.locationRegion,
    country: listing.locationCountry,
    feeAmount: listing.feeAmount ? Number(listing.feeAmount) : undefined,
    availabilityStatus: listing.availabilityStatus,
    listingStatus: listing.listingStatus,
    organizationType: listing.pet.organization.organizationType,
    trustScore: listing.trustRankSnapshot,
    moderationStatus: listing.moderationStatus,
    publishedAt: listing.publishedAt?.toISOString(),
    temperament: listing.pet.temperamentJson,
  });

  await searchClient.index({
    index: LISTING_INDEX,
    id: doc.id,
    body: doc,
  });

  console.log(`[search-index] Indexed listing ${id}`);
}

async function indexOrganization(id: string): Promise<void> {
  const org = await prisma.organization.findUniqueOrThrow({
    where: { id },
    include: {
      badges: { include: { badge: true } },
    },
  });

  const doc = buildOrganizationDocument({
    id: org.id,
    name: org.publicName,
    organizationType: org.organizationType,
    description: org.description,
    location:
      org.latitude && org.longitude
        ? { lat: org.latitude, lon: org.longitude }
        : undefined,
    city: org.city,
    region: org.region,
    country: org.country,
    status: org.status,
    badges: org.badges.map((b) => b.badge.code),
  });

  await searchClient.index({
    index: ORGANIZATION_INDEX,
    id: doc.id,
    body: doc,
  });

  console.log(`[search-index] Indexed organization ${id}`);
}

async function removeListing(id: string): Promise<void> {
  await searchClient.delete({
    index: LISTING_INDEX,
    id,
  });

  console.log(`[search-index] Removed listing ${id} from index`);
}

async function removeOrganization(id: string): Promise<void> {
  await searchClient.delete({
    index: ORGANIZATION_INDEX,
    id,
  });

  console.log(`[search-index] Removed organization ${id} from index`);
}

async function reindexAll(): Promise<void> {
  console.log('[search-index] Starting full reindex...');

  const listings = await prisma.petListing.findMany({
    where: { listingStatus: 'PUBLISHED' },
    select: { id: true },
  });

  for (const listing of listings) {
    await indexListing(listing.id);
  }
  console.log(`[search-index] Reindexed ${listings.length} listings`);

  const orgs = await prisma.organization.findMany({
    where: { status: 'ACTIVE' },
    select: { id: true },
  });

  for (const org of orgs) {
    await indexOrganization(org.id);
  }
  console.log(`[search-index] Reindexed ${orgs.length} organizations`);

  console.log('[search-index] Full reindex complete');
}
