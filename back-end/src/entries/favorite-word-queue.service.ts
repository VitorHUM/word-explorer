import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Queue, Worker, type JobsOptions } from 'bullmq';
import { AppConfigService } from '../infrastructure/config/app-config.service';
import { FavoriteWordRepository } from '../infrastructure/database/repositories/favorite-word.repository';

type FavoriteWordJobAction = 'favorite' | 'unfavorite';

interface FavoriteWordJob {
  action: FavoriteWordJobAction;
  userId: string;
  wordId: string;
}

@Injectable()
export class FavoriteWordQueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger('FavoriteWordQueue');
  private readonly queueName = 'favorite-words';
  private readonly queue: Queue<FavoriteWordJob>;
  private readonly defaultJobOptions: JobsOptions = {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: true,
    removeOnFail: 100,
  };
  private worker: Worker<FavoriteWordJob> | null = null;

  constructor(
    private readonly appConfigService: AppConfigService,
    private readonly favoriteWordRepository: FavoriteWordRepository,
  ) {
    this.queue = new Queue<FavoriteWordJob>(this.queueName, {
      connection: this.getRedisConnectionOptions(),
      defaultJobOptions: this.defaultJobOptions,
    });
  }

  onModuleInit(): void {
    this.worker = new Worker<FavoriteWordJob>(
      this.queueName,
      async (job) => {
        await this.processJob(job.data);
      },
      {
        connection: this.getRedisConnectionOptions(),
        concurrency: 5,
      },
    );

    this.worker.on('failed', (job, error) => {
      this.logger.warn(
        `Job ${job?.id ?? 'desconhecido'} falhou: ${error.message}`,
      );
    });

    this.worker.on('error', (error) => {
      this.logger.warn(`Falha no worker BullMQ: ${error.message}`);
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.worker?.close();
    await this.queue.close();
  }

  async enqueue(job: FavoriteWordJob): Promise<void> {
    await this.queue.add(job.action, job);
  }

  private async processJob(job: FavoriteWordJob): Promise<void> {
    if (job.action === 'unfavorite') {
      await this.favoriteWordRepository.deleteByUserAndWord({
        userId: job.userId,
        wordId: job.wordId,
      });
      return;
    }

    try {
      await this.favoriteWordRepository.create({
        userId: job.userId,
        wordId: job.wordId,
      });
    } catch (error: unknown) {
      if (this.isUniqueConstraintError(error)) {
        return;
      }

      throw error;
    }
  }

  private getRedisConnectionOptions(): {
    host?: string;
    port?: number;
    password?: string;
    tls?: Record<string, never>;
    maxRetriesPerRequest: null;
  } {
    const redisUrl = this.appConfigService.redisUrl;

    if (redisUrl) {
      const url = new URL(redisUrl);

      return {
        host: url.hostname,
        port: Number(url.port || 6379),
        password: url.password ? decodeURIComponent(url.password) : undefined,
        tls: url.protocol === 'rediss:' ? {} : undefined,
        maxRetriesPerRequest: null,
      };
    }

    return {
      host: this.appConfigService.redisHost,
      port: this.appConfigService.redisPort,
      password: this.appConfigService.redisPassword,
      maxRetriesPerRequest: null,
    };
  }

  private isUniqueConstraintError(
    error: unknown,
  ): error is Prisma.PrismaClientKnownRequestError {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError ||
      (typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'P2002')
    );
  }
}
