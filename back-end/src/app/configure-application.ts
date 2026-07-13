import {
  BadRequestException,
  ClassSerializerInterceptor,
  type INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import helmet from 'helmet';
import { HttpExceptionFilter } from '../common/filters/http-exception.filter';
import { AppConfigService } from '../infrastructure/config/app-config.service';
import { CacheableResponseInterceptor } from '../infrastructure/http/cacheable-response.interceptor';
import { ResponseTimeInterceptor } from './response-time.interceptor';

type CorsOriginCallback = (error: Error | null, allow?: boolean) => void;

export function configureApplication(app: INestApplication): void {
  const appConfigService = app.get(AppConfigService);
  const corsOriginHandler = (
    origin: string | undefined,
    callback: CorsOriginCallback,
  ): void => {
    if (!origin || appConfigService.corsAllowedOrigins.includes(origin)) {
      callback(null, true);

      return;
    }

    callback(null, false);
  };

  const corsOptions = {
    origin: corsOriginHandler,
    credentials: true,
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type'],
  };

  app.enableShutdownHooks();
  app.use(helmet());
  app.enableCors(corsOptions);
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(
    new ClassSerializerInterceptor(app.get(Reflector)),
    app.get(CacheableResponseInterceptor),
    new ResponseTimeInterceptor(),
  );
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      exceptionFactory: (validationErrors) => {
        const messages = validationErrors
          .flatMap((validationError) =>
            Object.values(validationError.constraints ?? {}),
          )
          .join('; ');

        return new BadRequestException(
          messages || 'Os dados enviados na requisição são inválidos.',
        );
      },
    }),
  );
}
