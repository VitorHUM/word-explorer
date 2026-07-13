import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { RepositoriesModule } from '../infrastructure/database/repositories/repositories.module';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  imports: [AuthModule, RepositoriesModule],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
