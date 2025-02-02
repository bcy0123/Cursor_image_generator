import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

const prismaGlobal = global as { prisma?: PrismaClient };

export const prisma = prismaGlobal.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  prismaGlobal.prisma = prisma;
} 