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

  get appBaseUrl(): string | undefined {
    return this.configService.get('APP_BASE_URL', { infer: true });
  }

  get databaseUrl(): string {
    return this.configService.getOrThrow('DATABASE_URL', { infer: true });
  }

  get corsAllowedOrigins(): string[] {
    return this.configService
      .getOrThrow('CORS_ALLOWED_ORIGINS', { infer: true })
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean);
  }

  get redisUrl(): string | undefined {
    return this.configService.get('REDIS_URL', { infer: true });
  }

  get redisHost(): string | undefined {
    return this.configService.get('REDIS_HOST', { infer: true });
  }

  get redisPort(): number | undefined {
    return this.configService.get('REDIS_PORT', { infer: true });
  }

  get redisPassword(): string | undefined {
    return this.configService.get('REDIS_PASSWORD', { infer: true });
  }

  get redisTtlSeconds(): number {
    return this.configService.getOrThrow('REDIS_TTL_SECONDS', { infer: true });
  }

  get throttleTtlMs(): number {
    return this.configService.getOrThrow('THROTTLE_TTL_MS', { infer: true });
  }

  get throttleLimit(): number {
    return this.configService.getOrThrow('THROTTLE_LIMIT', { infer: true });
  }

  get authThrottleTtlMs(): number {
    return this.configService.getOrThrow('AUTH_THROTTLE_TTL_MS', {
      infer: true,
    });
  }

  get authThrottleLimit(): number {
    return this.configService.getOrThrow('AUTH_THROTTLE_LIMIT', {
      infer: true,
    });
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
