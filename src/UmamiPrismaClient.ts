import { PrismaClient } from '@prisma/client';
import { readReplicas } from '@prisma/extension-read-replicas';
import { PrismaClientOptions, RawValue } from '@prisma/client/runtime/library';
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

interface QueryEvent {
  timestamp: Date;
  query: string;
  params: string;
  duration: number;
  target: string;
}

export class UmamiPrismaClient {
  client: PrismaClient;
  replicaUrl?: string;

  constructor({
    logQuery,
    queryLogger,
    replicaUrl,
    options = {},
  }: {
    logQuery?: boolean;
    queryLogger?: (event: QueryEvent) => void;
    replicaUrl?: string;
    options?: PrismaClientOptions;
  }) {
    this.client = new PrismaClient({
      errorFormat: 'pretty',
      ...(logQuery && PRISMA_LOG_OPTIONS),
      ...options,
    });

    this.replicaUrl = replicaUrl;

    if (replicaUrl) {
      this.client.$extends(
        readReplicas({
          url: replicaUrl,
        }),
      );
    }

    if (logQuery) {
      this.client.$on('query', queryLogger || log);
    }

    log('Prisma initialized');
  }

  async rawQuery(query: string, params: RawValue[] = []) {
    return this.replicaUrl
      ? this.client.$replica().$queryRawUnsafe(query, params)
      : this.client.$queryRawUnsafe(query, params);
  }

  async transaction(input: any, options?: any) {
    return this.client.$transaction(input, options);
  }
}

export default UmamiPrismaClient;
