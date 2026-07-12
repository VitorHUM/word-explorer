import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { createClient, type RedisClientType } from 'redis';
import { AppConfigService } from '../config/app-config.service';

@Injectable()
export class CacheService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger('Cache');
  private readonly redisClient: RedisClientType;

  constructor(private readonly appConfigService: AppConfigService) {
    this.redisClient = createClient({
      socket: {
        host: this.appConfigService.redisHost,
        port: this.appConfigService.redisPort,
        reconnectStrategy: false,
      },
    });

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

  async getJson<T>(key: string): Promise<T | null> {
    const isConnected = await this.connectIfNeeded();

    if (!isConnected) {
      return null;
    }

    try {
      const cachedValue = await this.redisClient.get(key);

      if (!cachedValue) {
        return null;
      }

      try {
        return JSON.parse(cachedValue) as T;
      } catch {
        this.logger.warn(`Cache corrompido detectado para a chave ${key}.`);

        await this.redisClient.del(key);

        return null;
      }
    } catch (error: unknown) {
      this.logRedisError('leitura', key, error);

      return null;
    }
  }

  async setJson(
    key: string,
    value: unknown,
    ttlSeconds: number,
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

  private logRedisError(operation: string, key: string, error: unknown): void {
    const errorMessage =
      error instanceof Error ? error.message : 'erro desconhecido';

    this.logger.warn(
      `Falha na ${operation} do cache para a chave ${key}: ${errorMessage}`,
    );
  }
}
