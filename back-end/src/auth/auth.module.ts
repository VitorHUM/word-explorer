import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import type { StringValue } from 'ms';
import { AppConfigService } from '../infrastructure/config/app-config.service';
import { EnvironmentConfigModule } from '../infrastructure/config/environment-config.module';
import { RepositoriesModule } from '../infrastructure/database/repositories/repositories.module';
import { AuthTokenService } from './auth-token.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Module({
  imports: [
    EnvironmentConfigModule,
    RepositoriesModule,
    JwtModule.registerAsync({
      imports: [EnvironmentConfigModule],
      inject: [AppConfigService],
      useFactory: (appConfigService: AppConfigService) => ({
        secret: appConfigService.jwtSecret,
        signOptions: {
          expiresIn: appConfigService.jwtExpiresIn as StringValue,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthTokenService, JwtAuthGuard],
  exports: [AuthTokenService, JwtAuthGuard],
})
export class AuthModule {}
