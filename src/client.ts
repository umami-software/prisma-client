import { PrismaClient } from '@prisma/client';
import { readReplicas } from '@prisma/extension-read-replicas';
import { PrismaClientOptions, RawValue } from '@prisma/client/runtime';
import chalk from 'chalk';
import debug from 'debug';

const log = debug('umami:prisma-client');
const PRISMA = Symbol();

const PRISMA_OPTIONS: PrismaClientOptions = {
  log: [
    {
      emit: 'event',
      level: 'query',
    },
  ],
};

function logQuery({ params, query, duration }) {
  log(chalk.yellow(params), '->', query, chalk.greenBright(`${duration}ms`));
}

function getClient(options: PrismaClientOptions): PrismaClient {
  const client = new PrismaClient(options);

  if (process.env.LOG_QUERY) {
    client.$on('query', logQuery);
  }

  if (process.env.NODE_ENV !== 'production') {
    global[PRISMA] = client;
  }

  if (process.env.DATABASE_REPLICA_URL) {
    client.$extends(
      readReplicas({
        url: process.env.DATABASE_REPLICA_URL,
      }),
    );
  }

  log('Prisma initialized');

  return client;
}

async function rawQuery(query: string, params: RawValue[] = []) {
  return process.env.DATABASE_REPLICA_URL
    ? prisma.$replica().$queryRawUnsafe.apply(prisma, [query, ...params])
    : prisma.$queryRawUnsafe.apply(prisma, [query, ...params]);
}

async function transaction(input: any, options?: any) {
  return prisma.$transaction(input, options);
}

// Initialization
const prisma: PrismaClient = (global[PRISMA] || getClient(PRISMA_OPTIONS)) as PrismaClient;

export default { client: prisma, log, rawQuery, transaction, PRISMA } as {
  client: PrismaClient;
  log: any;
  rawQuery: (query: string, params: RawValue[]) => Promise<any>;
  transaction: (input: any, options?: any) => Promise<any>;
  PRISMA: symbol;
};
