import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { createClient, type RedisClientType } from 'redis';
import { AppConfigService } from '../config/app-config.service';

export type CacheStatus = 'HIT' | 'MISS';

export interface CacheResult<T> {
  status: CacheStatus;
  data: T | null;
}

interface RedisScanOptions {
  MATCH: string;
  COUNT: number;
}

interface RedisClientAdapter {
  readonly isOpen: boolean;
  connect(): Promise<void>;
  quit(): Promise<void>;
  get(key: string): Promise<string | null>;
  set(key: string, value: string, options: { EX: number }): Promise<unknown>;
  del(keys: string | string[]): Promise<number>;
  scanIterator(options: RedisScanOptions): AsyncIterable<string>;
  on(event: 'error', listener: (error: Error) => void): void;
}

@Injectable()
export class CacheService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger('Cache');
  private readonly redisClient: RedisClientAdapter;

  constructor(private readonly appConfigService: AppConfigService) {
    this.redisClient = this.createRedisClient();
    this.redisClient.on('error', (error: Error) => {
      this.logger.warn(`Falha de conexão com o Redis: ${error.message}`);
    });
  }

  async onModuleInit(): Promise<void> {
    await this.connectIfNeeded();
  }

  async onModuleDestroy(): Promise<void> {
    if (this.redisClient.isOpen) {
      await this.redisClient.quit();
    }
  }

  async get<T>(key: string): Promise<CacheResult<T>> {
    const isConnected = await this.connectIfNeeded();

    if (!isConnected) {
      return { status: 'MISS', data: null };
    }

    try {
      const cachedValue = await this.redisClient.get(key);

      if (!cachedValue) {
        return { status: 'MISS', data: null };
      }

      try {
        return {
          status: 'HIT',
          data: JSON.parse(cachedValue) as T,
        };
      } catch {
        this.logger.warn(`Cache corrompido detectado para a chave ${key}.`);
        await this.redisClient.del(key);

        return { status: 'MISS', data: null };
      }
    } catch (error: unknown) {
      this.logRedisError('leitura', key, error);

      return { status: 'MISS', data: null };
    }
  }

  async getJson<T>(key: string): Promise<T | null> {
    const result = await this.get<T>(key);

    return result.data;
  }

  async set(
    key: string,
    value: unknown,
    ttlSeconds = this.appConfigService.redisTtlSeconds,
  ): Promise<void> {
    const isConnected = await this.connectIfNeeded();

    if (!isConnected) {
      return;
    }

    try {
      await this.redisClient.set(key, JSON.stringify(value), {
        EX: ttlSeconds,
      });
    } catch (error: unknown) {
      this.logRedisError('escrita', key, error);
    }
  }

  async setJson(
    key: string,
    value: unknown,
    ttlSeconds = this.appConfigService.redisTtlSeconds,
  ): Promise<void> {
    await this.set(key, value, ttlSeconds);
  }

  async delete(key: string): Promise<void> {
    const isConnected = await this.connectIfNeeded();

    if (!isConnected) {
      return;
    }

    try {
      await this.redisClient.del(key);
    } catch (error: unknown) {
      this.logRedisError('remoção', key, error);
    }
  }

  async deleteByPattern(pattern: string): Promise<number> {
    const isConnected = await this.connectIfNeeded();

    if (!isConnected) {
      return 0;
    }

    try {
      const keys: string[] = [];

      for await (const key of this.redisClient.scanIterator({
        MATCH: pattern,
        COUNT: 100,
      })) {
        keys.push(key);
      }

      if (keys.length === 0) {
        return 0;
      }

      return await this.redisClient.del(keys);
    } catch (error: unknown) {
      this.logRedisError('remoção por padrão', pattern, error);

      return 0;
    }
  }

  private async connectIfNeeded(): Promise<boolean> {
    if (this.redisClient.isOpen) {
      return true;
    }

    try {
      await this.redisClient.connect();

      return true;
    } catch (error: unknown) {
      this.logRedisError('conexão', 'redis', error);

      return false;
    }
  }

  private createRedisClient(): RedisClientAdapter {
    const client: RedisClientType = createClient({
      socket: {
        host: this.appConfigService.redisHost,
        port: this.appConfigService.redisPort,
        reconnectStrategy: false,
      },
    });

    return client as unknown as RedisClientAdapter;
  }

  private logRedisError(operation: string, key: string, error: unknown): void {
    const errorMessage =
      error instanceof Error ? error.message : 'erro desconhecido';

    this.logger.warn(
      `Falha na ${operation} do cache para a chave ${key}: ${errorMessage}`,
    );
  }
}
