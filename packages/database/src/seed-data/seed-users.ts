import { PrismaClient } from '@prisma/client';
import { USERS } from './users';
import { PASSWORD_HASH, randomDate } from './helpers';

export async function seedUsers(prisma: PrismaClient) {
  const roleMap = new Map<string, string>();
  const allRoles = await prisma.role.findMany();
  for (const r of allRoles) roleMap.set(r.name, r.id);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@petcentral.com' },
    update: {},
    create: {
      email: 'admin@petcentral.com',
      passwordHash: PASSWORD_HASH,
      status: 'ACTIVE',
      emailVerifiedAt: new Date(),
      mfaEnabled: false,
      profile: { create: { displayName: 'System Admin' } },
      roles: { create: { roleId: roleMap.get('admin')! } },
    },
  });
  console.log(`  Created admin user: ${adminUser.email}`);

  const userIds: string[] = [adminUser.id];

  for (const u of USERS) {
    const existing = await prisma.user.findUnique({ where: { email: u.email } });
    if (existing) { userIds.push(existing.id); continue; }

    const user = await prisma.user.create({
      data: {
        email: u.email,
        passwordHash: PASSWORD_HASH,
        status: 'ACTIVE',
        emailVerifiedAt: randomDate(365),
        lastLoginAt: randomDate(30),
        mfaEnabled: false,
        profile: {
          create: {
            displayName: u.displayName,
            city: u.city,
            stateRegion: u.stateRegion,
            country: u.country,
            bio: u.bio,
          },
        },
        roles: {
          create: { roleId: roleMap.get(u.role)! },
        },
      },
    });
    userIds.push(user.id);
  }
  console.log(`  Created ${USERS.length} additional users`);
  return userIds;
}
