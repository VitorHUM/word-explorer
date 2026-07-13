import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function configureOpenApi(app: INestApplication): void {
  const documentBuilder = new DocumentBuilder()
    .setTitle('Word Explorer API')
    .setDescription(
      'Word Explorer API para listar palavras em inglês, utilizando como base a Free Dictionary API.',
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      'bearer',
    );

  const document = SwaggerModule.createDocument(app, documentBuilder.build());

  SwaggerModule.setup('docs', app, document, {
    jsonDocumentUrl: 'docs/json',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      docExpansion: 'list',
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });
}
