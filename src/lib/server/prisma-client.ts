import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

export function createPrismaClient(
  connectionString: string,
  options?: ConstructorParameters<typeof PrismaClient>[0]
) {
  return new PrismaClient({
    ...options,
    adapter: new PrismaPg({ connectionString })
  });
}
