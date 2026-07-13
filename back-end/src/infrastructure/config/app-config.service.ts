import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  type EnvironmentVariables,
  type NodeEnvironment,
} from './environment.type';

@Injectable()
export class AppConfigService {
  constructor(
    private readonly configService: ConfigService<EnvironmentVariables, true>,
  ) {}

  get nodeEnv(): NodeEnvironment {
    return this.configService.getOrThrow('NODE_ENV', { infer: true });
  }

  get port(): number {
    return this.configService.getOrThrow('PORT', { infer: true });
  }

  get databaseUrl(): string {
    return this.configService.getOrThrow('DATABASE_URL', { infer: true });
  }

  get redisHost(): string {
    return this.configService.getOrThrow('REDIS_HOST', { infer: true });
  }

  get redisPort(): number {
    return this.configService.getOrThrow('REDIS_PORT', { infer: true });
  }

  get redisTtlSeconds(): number {
    return this.configService.getOrThrow('REDIS_TTL_SECONDS', { infer: true });
  }

  get jwtSecret(): string {
    return this.configService.getOrThrow('JWT_SECRET', { infer: true });
  }

  get jwtExpiresIn(): string {
    return this.configService.getOrThrow('JWT_EXPIRES_IN', { infer: true });
  }

  get dictionaryApiUrl(): string {
    return this.configService.getOrThrow('DICTIONARY_API_URL', {
      infer: true,
    });
  }

  get dictionaryCacheTtlSeconds(): number {
    return this.configService.getOrThrow('DICTIONARY_CACHE_TTL_SECONDS', {
      infer: true,
    });
  }
}
