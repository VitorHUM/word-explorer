import { Module } from '@nestjs/common';
import { EnvironmentConfigModule } from '../config/environment-config.module';
import { CacheService } from './cache.service';

@Module({
  imports: [EnvironmentConfigModule],
  providers: [CacheService],
  exports: [CacheService],
})
export class CacheModule {}
