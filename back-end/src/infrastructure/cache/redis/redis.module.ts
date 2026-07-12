import { Module } from '@nestjs/common';
import type { RedisOptions } from 'ioredis';
import { AppConfigService } from '../../config/app-config.service';
import { EnvironmentConfigModule } from '../../config/environment-config.module';

export const REDIS_OPTIONS = Symbol('REDIS_OPTIONS');

@Module({
  imports: [EnvironmentConfigModule],
  providers: [
    {
      provide: REDIS_OPTIONS,
      inject: [AppConfigService],
      useFactory: (appConfigService: AppConfigService): RedisOptions => ({
        host: appConfigService.redisHost,
        port: appConfigService.redisPort,
        lazyConnect: true,
        maxRetriesPerRequest: 1,
      }),
    },
  ],
  exports: [REDIS_OPTIONS],
})
export class RedisModule {}
