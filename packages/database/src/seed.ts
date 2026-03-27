import { PrismaClient } from '@prisma/client';
import { seedRolesAndBadges } from './seed-data/seed-roles-badges';
import { seedUsers } from './seed-data/seed-users';
import { seedOrganizations } from './seed-data/seed-orgs';
import { seedPets } from './seed-data/seed-pets';
import { seedInteractionsAndReviews, seedConversations } from './seed-data/seed-interactions';
import { seedPartnerOrgs, seedResources, seedCases, seedAuditLogs } from './seed-data/seed-supporting';
import { DOG_BREEDS, DOG_NAMES, DOG_DESCRIPTIONS } from './seed-data/dogs';
import { CAT_BREEDS, CAT_NAMES, CAT_DESCRIPTIONS } from './seed-data/cats';
import { BIRD_BREEDS, BIRD_NAMES, BIRD_DESCRIPTIONS } from './seed-data/birds';

const prisma = new PrismaClient();

async function main() {
  const start = Date.now();
  console.log('=== Pet Central Database Seed ===\n');

  console.log('[1/8] Seeding roles and badges...');
  await seedRolesAndBadges(prisma);

  console.log('[2/8] Seeding users...');
  const userIds = await seedUsers(prisma);

  console.log('[3/8] Seeding organizations...');
  const orgIds = await seedOrganizations(prisma, userIds);

  console.log('[4/8] Seeding pets (900 total: 300 dogs, 300 cats, 300 birds)...');
  const { listingIds } = await seedPets(prisma, orgIds, [
    { petType: 'DOG', breeds: DOG_BREEDS, names: DOG_NAMES, descriptions: DOG_DESCRIPTIONS, count: 300 },
    { petType: 'CAT', breeds: CAT_BREEDS, names: CAT_NAMES, descriptions: CAT_DESCRIPTIONS, count: 300 },
    { petType: 'BIRD', breeds: BIRD_BREEDS, names: BIRD_NAMES, descriptions: BIRD_DESCRIPTIONS, count: 300 },
  ]);

  console.log('[5/8] Seeding interactions and reviews...');
  await seedInteractionsAndReviews(prisma, userIds, orgIds, listingIds);

  console.log('[6/8] Seeding conversations...');
  await seedConversations(prisma, userIds, orgIds, listingIds);

  console.log('[7/8] Seeding partner organizations, resources, and cases...');
  await seedPartnerOrgs(prisma, userIds);
  await seedResources(prisma, userIds, orgIds);
  await seedCases(prisma, userIds, orgIds);

  console.log('[8/8] Seeding audit logs...');
  await seedAuditLogs(prisma);

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`\n=== Seed completed in ${elapsed}s ===`);
  console.log(`Summary:`);
  console.log(`  - 11 roles, 6 badges`);
  console.log(`  - ${userIds.length} users (1 admin + 37 users)`);
  console.log(`  - ${orgIds.length} organizations with verifications & badges`);
  console.log(`  - 900 pets (300 dogs, 300 cats, 300 birds)`);
  console.log(`  - 900 pet listings with media & attributes`);
  console.log(`  - 200 favorites, 150 interactions, 100 reviews`);
  console.log(`  - 50 conversations with messages`);
  console.log(`  - 5 partner organizations, 8 resources, 20 cases`);
  console.log(`  - 50 audit log entries`);
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
