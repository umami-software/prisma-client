import { PrismaClient } from '@prisma/client';
import chalk from 'chalk';
import debug from 'debug';

const log = debug('umami:prisma-client');
const PRISMA = Symbol();

const PRISMA_OPTIONS = {
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

function getClient(options) {
  const client = new PrismaClient(options);

  if (process.env.LOG_QUERY) {
    client.$on('query', logQuery);
  }

  if (process.env.NODE_ENV !== 'production') {
    global[PRISMA] = client;
  }

  log('Prisma initialized');

  return client;
}

async function rawQuery(query, params = []) {
  return prisma.$queryRawUnsafe.apply(prisma, [query, ...params]);
}

async function transaction(queries) {
  return prisma.$transaction(queries);
}

// Initialization
const prisma = global[PRISMA] || getClient(PRISMA_OPTIONS);

export default { client: prisma, log, rawQuery, transaction, PRISMA };
