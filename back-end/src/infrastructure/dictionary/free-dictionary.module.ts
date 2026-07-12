import { Module } from '@nestjs/common';
import { CacheModule } from '../cache/cache.module';
import { EnvironmentConfigModule } from '../config/environment-config.module';
import { FreeDictionaryClient } from './free-dictionary.client';

@Module({
  imports: [EnvironmentConfigModule, CacheModule],
  providers: [FreeDictionaryClient],
  exports: [FreeDictionaryClient],
})
export class FreeDictionaryModule {}
