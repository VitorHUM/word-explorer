import {
  BadRequestException,
  type INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { HttpExceptionFilter } from '../common/filters/http-exception.filter';
import { CacheableResponseInterceptor } from '../infrastructure/http/cacheable-response.interceptor';
import { ResponseTimeInterceptor } from './response-time.interceptor';

export function configureApplication(app: INestApplication): void {
  app.enableShutdownHooks();
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(
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
