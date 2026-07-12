import {
  BadRequestException,
  type INestApplication,
  ValidationPipe,
} from '@nestjs/common';

export function configureApplication(app: INestApplication): void {
  app.enableShutdownHooks();
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
