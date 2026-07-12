import { Module } from '@nestjs/common';
import { CacheModule } from './cache/cache.module';
import { EnvironmentConfigModule } from './config/environment-config.module';
import { PrismaModule } from './database/prisma/prisma.module';
import { FreeDictionaryModule } from './dictionary/free-dictionary.module';

@Module({
  imports: [
    EnvironmentConfigModule,
    PrismaModule,
    CacheModule,
    FreeDictionaryModule,
  ],
  exports: [
    EnvironmentConfigModule,
    PrismaModule,
    CacheModule,
    FreeDictionaryModule,
  ],
})
export class InfrastructureModule {}
