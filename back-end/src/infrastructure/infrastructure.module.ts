import { Module } from '@nestjs/common';
import { CacheModule } from './cache/cache.module';
import { EnvironmentConfigModule } from './config/environment-config.module';
import { PrismaModule } from './database/prisma/prisma.module';
import { RepositoriesModule } from './database/repositories/repositories.module';
import { FreeDictionaryModule } from './dictionary/free-dictionary.module';

@Module({
  imports: [
    EnvironmentConfigModule,
    PrismaModule,
    RepositoriesModule,
    CacheModule,
    FreeDictionaryModule,
  ],
  exports: [
    EnvironmentConfigModule,
    PrismaModule,
    RepositoriesModule,
    CacheModule,
    FreeDictionaryModule,
  ],
})
export class InfrastructureModule {}
