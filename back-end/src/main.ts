import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configureApplication } from './app/configure-application';
import { AppConfigService } from './infrastructure/config/app-config.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  configureApplication(app);

  const appConfigService = app.get(AppConfigService);

  await app.listen(appConfigService.port);
}

void bootstrap();
