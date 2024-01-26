import UmamiPrismaClient from './UmamiPrismaClient';
import { PrismaClientOptions } from '@prisma/client/runtime';

const PRISMA = Symbol();

export function getClient(params?: {
  logQuery?: boolean;
  queryLogger?: () => void;
  replicaUrl?: string;
  options?: PrismaClientOptions;
}): UmamiPrismaClient {
  const {
    logQuery = !!process.env.LOG_QUERY,
    queryLogger,
    replicaUrl = process.env.DATABASE_REPLICA_URL,
    options,
  } = params || {};

  return new UmamiPrismaClient({
    logQuery,
    queryLogger,
    replicaUrl,
    options,
  });
}

const client = global[PRISMA] || getClient();

export { UmamiPrismaClient };

export default { client, PRISMA };
