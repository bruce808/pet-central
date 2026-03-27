import { PrismaClient } from '@prisma/client';

const ROLES = [
  'guest', 'authenticated_user', 'vendor_member', 'vendor_admin',
  'validator', 'nonprofit_partner', 'agency_partner', 'support_agent',
  'trust_analyst', 'moderator', 'admin',
];

const BADGES = [
  { code: 'verified_identity', label: 'Verified Identity', description: 'Identity has been verified' },
  { code: 'verified_organization', label: 'Verified Organization', description: 'Organization legitimacy confirmed' },
  { code: 'nonprofit_validated', label: 'Nonprofit Validated', description: 'Nonprofit status validated by partner' },
  { code: 'agency_affiliated', label: 'Agency Affiliated', description: 'Affiliated with a recognized agency' },
  { code: 'top_rated', label: 'Top Rated', description: 'Consistently high review scores' },
  { code: 'responsive_vendor', label: 'Responsive Vendor', description: 'Fast response times to inquiries' },
];

export async function seedRolesAndBadges(prisma: PrismaClient) {
  for (const name of ROLES) {
    await prisma.role.upsert({ where: { name }, update: {}, create: { name } });
  }
  console.log(`  Created ${ROLES.length} roles`);

  for (const badge of BADGES) {
    await prisma.trustBadge.upsert({ where: { code: badge.code }, update: {}, create: badge });
  }
  console.log(`  Created ${BADGES.length} trust badges`);
}
