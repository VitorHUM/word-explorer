import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { AppConfigService } from '../../config/app-config.service';
import { createPrismaClientOptions } from './prisma-client.factory';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  constructor(appConfigService: AppConfigService) {
    super(createPrismaClientOptions(appConfigService.databaseUrl));
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
