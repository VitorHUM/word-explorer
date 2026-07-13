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

  logger.log('\x1b[1m');
  logger.log('✅ Word Explorer API Up and Running.');
  logger.log(`\x1b[1m🔌 API: \x1b[4m${baseUrl}\x1b[0m\x1b[1m`);
  logger.log(`📖 Swagger Docs: \x1b[4m${baseUrl}/docs\x1b[0m\x1b[1m`);
  logger.log(`📃 OpenAPI JSON: \x1b[4m${baseUrl}/docs/json\x1b[0m`);
  logger.log('');
}

void bootstrap();
