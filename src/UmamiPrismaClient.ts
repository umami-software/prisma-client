import debug from 'debug';
import { PrismaClient } from '@prisma/client/extension';
import { PrismaPg } from '@prisma/adapter-pg';
import { readReplicas } from '@prisma/extension-read-replicas';

const PRISMA_LOG_OPTIONS = {
  log: [
    {
      emit: 'event',
      level: 'query',
    },
  ],
};

export const log = debug('umami:prisma-client');

export interface UmamiPrismaClientOptions {
  prismaClient: PrismaClient;
  url: string;
  replicaUrl?: string;
  logQuery?: boolean;
  queryLogger?: () => void;
  options?: any;
}

export class UmamiPrismaClient {
  client: PrismaClient;
  hasReplica: boolean;

  constructor({
    prismaClient,
    url,
    replicaUrl,
    logQuery,
    queryLogger,
    options,
  }: UmamiPrismaClientOptions) {
    const connectionUrl = new URL(url);

    const adapter = new PrismaPg(
      { connectionString: url.toString() },
      { schema: connectionUrl.searchParams.get('schema') ?? undefined },
    );

    const prisma = new prismaClient({
      adapter,
      errorFormat: 'pretty',
      ...(logQuery && PRISMA_LOG_OPTIONS),
      ...options,
    });

    if (replicaUrl) {
      prisma.$extends(
        readReplicas({
          url: replicaUrl,
        }),
      );
    }
    this.hasReplica = !!replicaUrl;

    if (logQuery) {
      prisma.$on('query' as never, queryLogger || log);
    }

    log('Prisma initialized');

    this.client = prisma;
  }

  async rawQuery(query: string, params: any[] = []) {
    return this.hasReplica
      ? this.client.$replica().$queryRawUnsafe(query, params)
      : this.client.$queryRawUnsafe(query, params);
  }

  async transaction(input: any, options?: any) {
    return this.client.$transaction(input, options);
  }
}
