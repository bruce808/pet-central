import { PrismaClient } from '@prisma/client';

export * from '@prisma/client';

const _global = globalThis;
const _prismaKey = 'prisma';

export const prisma: PrismaClient =
  (_global[_prismaKey] ?? new PrismaClient());

if (process.env.NODE_ENV !== 'production') {
  _global[_prismaKey] = prisma;
}

export { prisma as db };
