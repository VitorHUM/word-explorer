import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../infrastructure/database/prisma/prisma.module';
import { UserController } from './user.controller';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [UserController],
})
export class UserModule {}
