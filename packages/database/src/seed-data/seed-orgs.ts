import { PrismaClient } from '@prisma/client';
import { ORGANIZATIONS } from './organizations';
import { pick, randInt } from './helpers';

export async function seedOrganizations(prisma: PrismaClient, userIds: string[]) {
  const vendorAdminIds = userIds.slice(26, 31); // vendor admin users
  const staffIds = userIds.slice(31, 34); // staff users
  const orgIds: string[] = [];

  for (let i = 0; i < ORGANIZATIONS.length; i++) {
    const o = ORGANIZATIONS[i];
    const existing = await prisma.organization.findFirst({ where: { email: o.email } });
    if (existing) { orgIds.push(existing.id); continue; }

    const org = await prisma.organization.create({
      data: {
        legalName: o.legalName,
        publicName: o.publicName,
        organizationType: o.organizationType,
        description: o.description,
        websiteUrl: o.websiteUrl,
        phone: o.phone,
        email: o.email,
        addressLine1: o.addressLine1,
        city: o.city,
        region: o.region,
        postalCode: o.postalCode,
        country: o.country,
        latitude: o.latitude,
        longitude: o.longitude,
        serviceRadiusKm: randInt(25, 150),
        status: 'ACTIVE',
        dataSource: 'mock',
      },
    });
    orgIds.push(org.id);

    const adminId = vendorAdminIds[i % vendorAdminIds.length];
    await prisma.organizationMember.create({
      data: { organizationId: org.id, userId: adminId, membershipRole: 'ADMIN' },
    }).catch(() => {});

    if (i < staffIds.length) {
      await prisma.organizationMember.create({
        data: { organizationId: org.id, userId: staffIds[i], membershipRole: 'STAFF' },
      }).catch(() => {});
    }
  }
  console.log(`  Created ${ORGANIZATIONS.length} organizations`);

  // Assign badges to some orgs
  const badges = await prisma.trustBadge.findMany();
  const adminUserId = userIds[0];
  for (let i = 0; i < orgIds.length; i++) {
    const numBadges = randInt(1, 3);
    const selectedBadges = [...badges].sort(() => Math.random() - 0.5).slice(0, numBadges);
    for (const badge of selectedBadges) {
      await prisma.organizationBadge.create({
        data: { organizationId: orgIds[i], badgeId: badge.id, assignedByUserId: adminUserId },
      }).catch(() => {});
    }
  }
  console.log(`  Assigned trust badges to organizations`);

  // Add verifications
  for (const orgId of orgIds) {
    const vTypes: Array<'IDENTITY' | 'BUSINESS_LICENSE' | 'INSURANCE'> = ['IDENTITY', 'BUSINESS_LICENSE', 'INSURANCE'];
    const numV = randInt(1, 3);
    for (let v = 0; v < numV; v++) {
      await prisma.organizationVerification.create({
        data: {
          organizationId: orgId,
          verificationType: vTypes[v],
          status: pick(['APPROVED', 'APPROVED', 'APPROVED', 'PENDING']),
          reviewedByUserId: pick([adminUserId, ...vendorAdminIds]),
          reviewedAt: new Date(),
        },
      });
    }
  }
  console.log(`  Added verifications to organizations`);

  return orgIds;
}
