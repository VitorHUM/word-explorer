import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CacheModule } from '../infrastructure/cache/cache.module';
import { PrismaModule } from '../infrastructure/database/prisma/prisma.module';
import { FreeDictionaryModule } from '../infrastructure/dictionary/free-dictionary.module';
import { EntriesController } from './entries.controller';
import { EntriesService } from './entries.service';

@Module({
  imports: [AuthModule, CacheModule, PrismaModule, FreeDictionaryModule],
  controllers: [EntriesController],
  providers: [EntriesService],
})
export class EntriesModule {}
