import { Module } from '@nestjs/common';
import { EnvironmentConfigModule } from '../config/environment-config.module';
import { FreeDictionaryClient } from './free-dictionary.client';

@Module({
  imports: [EnvironmentConfigModule],
  providers: [FreeDictionaryClient],
  exports: [FreeDictionaryClient],
})
export class FreeDictionaryModule {}
