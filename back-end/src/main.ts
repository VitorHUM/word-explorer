import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configureApplication } from './app/configure-application';
import { configureOpenApi } from './app/configure-open-api';
import { AppConfigService } from './infrastructure/config/app-config.service';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);
  configureApplication(app);
  configureOpenApi(app);

  const appConfigService = app.get(AppConfigService);
  const baseUrl = `http://localhost:${appConfigService.port}`;

  await app.listen(appConfigService.port);

  logger.log('');
  logger.log('✅ Word Explorer API iniciada com sucesso.');
  logger.log(`🔌 API: ${baseUrl}`);
  logger.log(`📖 Documentação Swagger: ${baseUrl}/docs`);
  logger.log(`📃 OpenAPI JSON: ${baseUrl}/docs/json`);
  logger.log('');
}

void bootstrap();
