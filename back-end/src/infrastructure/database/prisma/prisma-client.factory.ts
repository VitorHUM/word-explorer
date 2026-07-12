import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

export function createPrismaClientOptions(
  databaseUrl: string,
): ConstructorParameters<typeof PrismaClient>[0] {
  return {
    adapter: new PrismaPg({
      connectionString: databaseUrl,
    }),
  };
}

export function createPrismaClient(databaseUrl: string): PrismaClient {
  return new PrismaClient(createPrismaClientOptions(databaseUrl));
}
