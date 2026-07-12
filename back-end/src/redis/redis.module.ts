import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { RedisOptions } from 'ioredis';
import { REDIS_OPTIONS } from './redis.constants';

@Global()
@Module({
  providers: [
    {
      provide: REDIS_OPTIONS,
      inject: [ConfigService],
      useFactory: (configService: ConfigService): RedisOptions => ({
        host: configService.getOrThrow<string>('REDIS_HOST'),
        port: configService.getOrThrow<number>('REDIS_PORT'),
        password: configService.get<string>('REDIS_PASSWORD') || undefined,
        db: configService.getOrThrow<number>('REDIS_DB'),
        lazyConnect: true,
        maxRetriesPerRequest: 1,
      }),
    },
  ],
  exports: [REDIS_OPTIONS],
})
export class RedisModule {}
