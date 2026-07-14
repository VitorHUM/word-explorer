import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CacheModule } from '../infrastructure/cache/cache.module';
import { EnvironmentConfigModule } from '../infrastructure/config/environment-config.module';
import { RepositoriesModule } from '../infrastructure/database/repositories/repositories.module';
import { FreeDictionaryModule } from '../infrastructure/dictionary/free-dictionary.module';
import { EntriesController } from './entries.controller';
import { EntriesService } from './entries.service';
import { FavoriteWordQueueService } from './favorite-word-queue.service';

@Module({
  imports: [
    AuthModule,
    CacheModule,
    EnvironmentConfigModule,
    RepositoriesModule,
    FreeDictionaryModule,
  ],
  controllers: [EntriesController],
  providers: [EntriesService, FavoriteWordQueueService],
})
export class EntriesModule {}
