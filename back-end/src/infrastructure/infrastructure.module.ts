import { Module } from '@nestjs/common';
import { RedisModule } from './cache/redis/redis.module';
import { EnvironmentConfigModule } from './config/environment-config.module';
import { PrismaModule } from './database/prisma/prisma.module';
import { FreeDictionaryModule } from './dictionary/free-dictionary.module';

@Module({
  imports: [
    EnvironmentConfigModule,
    PrismaModule,
    RedisModule,
    FreeDictionaryModule,
  ],
  exports: [
    EnvironmentConfigModule,
    PrismaModule,
    RedisModule,
    FreeDictionaryModule,
  ],
})
export class InfrastructureModule {}
