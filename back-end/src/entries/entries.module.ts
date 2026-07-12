import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../infrastructure/database/prisma/prisma.module';
import { EntriesController } from './entries.controller';
import { EntriesService } from './entries.service';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [EntriesController],
  providers: [EntriesService],
})
export class EntriesModule {}
