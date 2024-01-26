import { PrismaClient } from '@prisma/client';
import { readReplicas } from '@prisma/extension-read-replicas';
import { PrismaClientOptions } from '@prisma/client/runtime';
import chalk from 'chalk';
import debug from 'debug';

const log = debug('umami:prisma-client');

const PRISMA_LOG_OPTIONS = {
  log: [
    {
      emit: 'event',
      level: 'query',
    },
  ],
};

export class UmamiPrismaClient {
  client: PrismaClient;

  constructor({
    logQuery,
    queryLogger,
    replicaUrl,
    options = {},
  }: {
    logQuery?: boolean;
    queryLogger?: () => void;
    replicaUrl?: string;
    options?: PrismaClientOptions;
  }) {
    this.client = new PrismaClient({
      ...(logQuery && PRISMA_LOG_OPTIONS),
      ...options,
    });

    if (logQuery) {
      this.client.$on('query', queryLogger || this.logQuery);
    }

    if (replicaUrl) {
      this.client.$extends(
        readReplicas({
          url: replicaUrl,
        }),
      );
    }

    log('Prisma initialized');
  }

  logQuery({ params, query, duration }) {
    log(chalk.yellow(params), '->', query, chalk.greenBright(`${duration}ms`));
  }
}

export default UmamiPrismaClient;
