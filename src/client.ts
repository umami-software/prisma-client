import { PrismaClient } from '@prisma/client';
import { readReplicas } from '@prisma/extension-read-replicas';
import { PrismaClientOptions, RawValue } from '@prisma/client/runtime/library';
import debug from 'debug';

const log = debug('umami:prisma-client');
const PRISMA = Symbol();
const PRISMA_LOG_OPTIONS = {
  log: [
    {
      emit: 'event',
      level: 'query',
    },
  ],
};

export function getClient(params?: {
  logQuery?: boolean;
  queryLogger?: () => void;
  replicaUrl?: string;
  options?: PrismaClientOptions;
}): PrismaClient {
  const {
    logQuery = !!process.env.LOG_QUERY,
    queryLogger,
    replicaUrl = process.env.DATABASE_REPLICA_URL,
    options,
  } = params || {};

  const client = new PrismaClient({
    errorFormat: 'pretty',
    ...(logQuery && PRISMA_LOG_OPTIONS),
    ...options,
  });

  if (replicaUrl) {
    client.$extends(
      readReplicas({
        url: replicaUrl,
      }),
    );
  }

  if (logQuery) {
    client.$on('query', queryLogger || log);
  }

  log('Prisma initialized');

  return client;
}

const client = global[PRISMA] || getClient();

async function rawQuery(query: string, params: RawValue[] = []) {
  return process.env.DATABASE_REPLICA_URL
    ? client.$replica().$queryRawUnsafe(query, params)
    : client.$queryRawUnsafe(query, params);
}

async function transaction(input: any, options?: any) {
  return client.$transaction(input, options);
}

export default { client, log, PRISMA, rawQuery, transaction };
