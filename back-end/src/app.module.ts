import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { AppController } from './app/app.controller';
import { AppService } from './app/app.service';
import { AuthModule } from './auth/auth.module';
import { EntriesModule } from './entries/entries.module';
import { CacheableResponseInterceptor } from './infrastructure/http/cacheable-response.interceptor';
import { HttpLoggingMiddleware } from './infrastructure/http/http-logging.middleware';
import { InfrastructureModule } from './infrastructure/infrastructure.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [InfrastructureModule, AuthModule, UserModule, EntriesModule],
  controllers: [AppController],
  providers: [AppService, CacheableResponseInterceptor],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(HttpLoggingMiddleware).forRoutes({
      path: '*',
      method: RequestMethod.ALL,
    });
  }
}
