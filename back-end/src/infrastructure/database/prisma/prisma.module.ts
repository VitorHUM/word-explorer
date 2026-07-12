import { Module } from '@nestjs/common';
import { EnvironmentConfigModule } from '../../config/environment-config.module';
import { PrismaService } from './prisma.service';

@Module({
  imports: [EnvironmentConfigModule],
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
