import { Module } from '@nestjs/common';
import { RedisModule } from './cache/redis/redis.module';
import { EnvironmentConfigModule } from './config/environment-config.module';
import { PrismaModule } from './database/prisma/prisma.module';

@Module({
  imports: [EnvironmentConfigModule, PrismaModule, RedisModule],
  exports: [EnvironmentConfigModule, PrismaModule, RedisModule],
})
export class InfrastructureModule {}
