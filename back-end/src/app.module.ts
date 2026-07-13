import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app/app.controller';
import { AppService } from './app/app.service';
import { AuthModule } from './auth/auth.module';
import { EntriesModule } from './entries/entries.module';
import { AppConfigService } from './infrastructure/config/app-config.service';
import { EnvironmentConfigModule } from './infrastructure/config/environment-config.module';
import { CacheableResponseInterceptor } from './infrastructure/http/cacheable-response.interceptor';
import { HttpLoggingMiddleware } from './infrastructure/http/http-logging.middleware';
import { InfrastructureModule } from './infrastructure/infrastructure.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    InfrastructureModule,
    EnvironmentConfigModule,
    ThrottlerModule.forRootAsync({
      imports: [EnvironmentConfigModule],
      inject: [AppConfigService],
      useFactory: (appConfigService: AppConfigService) => ({
        errorMessage: 'Muitas requisições. Tente novamente em instantes.',
        throttlers: [
          {
            name: 'default',
            ttl: appConfigService.throttleTtlMs,
            limit: appConfigService.throttleLimit,
          },
          {
            name: 'auth',
            ttl: appConfigService.authThrottleTtlMs,
            limit: appConfigService.authThrottleLimit,
          },
        ],
      }),
    }),
    AuthModule,
    UserModule,
    EntriesModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    CacheableResponseInterceptor,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(HttpLoggingMiddleware).forRoutes({
      path: '*',
      method: RequestMethod.ALL,
    });
  }
}
