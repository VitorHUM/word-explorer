import type { INestApplication } from '@nestjs/common';
import type { OpenAPIObject } from '@nestjs/swagger';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ErrorResponseDto } from '../common/dtos/error-response.dto';

const HTTP_METHODS = [
  'get',
  'post',
  'put',
  'patch',
  'delete',
  'options',
  'head',
] as const;

const responseTimeHeader = {
  description: 'Tempo de processamento da resposta em milissegundos.',
  schema: {
    type: 'integer',
    example: 12,
  },
};

const cacheHeader = {
  description:
    'HIT significa resposta recuperada do Redis; MISS significa consulta ao PostgreSQL ou serviço externo.',
  schema: {
    type: 'string',
    enum: ['HIT', 'MISS'],
    example: 'MISS',
  },
};

const errorResponseSchema = {
  $ref: '#/components/schemas/ErrorResponseDto',
};

type HttpMethod = (typeof HTTP_METHODS)[number];

interface ResponseExample {
  summary: string;
  value: unknown;
}

interface MediaTypeDocumentation {
  schema?: unknown;
  examples?: Record<string, ResponseExample>;
}

interface ResponseDocumentation {
  headers?: Record<string, unknown>;
  content?: Record<string, MediaTypeDocumentation>;
}

interface OperationDocumentation {
  responses?: Record<string, ResponseDocumentation>;
  'x-response-time'?: unknown;
  'x-cache'?: unknown;
}

type PathDocumentation = Partial<Record<HttpMethod, OperationDocumentation>>;

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
        description: 'Insira o seu token JWT (sem o prefixo "Bearer")',
        in: 'header',
      },
      'bearer',
    );

  const document = SwaggerModule.createDocument(app, documentBuilder.build(), {
    extraModels: [ErrorResponseDto],
  });

  document.openapi = '3.0.0';
  applyResponseDocumentation(document);

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

function applyResponseDocumentation(document: OpenAPIObject): void {
  const paths = document.paths as Record<string, PathDocumentation | undefined>;

  for (const pathItem of Object.values(paths)) {
    for (const method of HTTP_METHODS) {
      const operation = pathItem?.[method];

      if (!operation?.responses) {
        continue;
      }

      operation['x-response-time'] = {
        header: 'x-response-time',
        type: 'integer',
        unit: 'milliseconds',
      };

      for (const [statusCode, response] of Object.entries(
        operation.responses,
      )) {
        response.headers = {
          ...(response.headers ?? {}),
          'x-response-time': responseTimeHeader,
        };

        if (Number(statusCode) >= 400) {
          response.content ??= {};
          response.content['application/json'] ??= {
            schema: errorResponseSchema,
          };
          response.content['application/json'].schema ??= errorResponseSchema;
        }
      }
    }
  }

  applyCacheDocumentation(document, '/entries/en', 'get', {
    miss: {
      summary: 'MISS - consulta ao PostgreSQL',
      value: {
        results: ['fire', 'firefly'],
        totalDocs: 2,
        page: 1,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      },
    },
    hit: {
      summary: 'HIT - resposta recuperada do Redis',
      value: {
        results: ['fire', 'firefly'],
        totalDocs: 2,
        page: 1,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      },
    },
  });

  applyCacheDocumentation(document, '/entries/en/{word}', 'get', {
    miss: {
      summary: 'MISS - consulta ao serviço externo',
      value: {
        word: 'fire',
        phonetics: [
          {
            text: '/faɪə/',
            audio:
              'https://api.dictionaryapi.dev/media/pronunciations/en/fire-us.mp3',
          },
        ],
        meanings: [
          {
            partOfSpeech: 'noun',
            definitions: [
              {
                definition: 'Combustion or burning.',
                example: 'The fire was warm.',
                synonyms: ['blaze'],
                antonyms: ['ice'],
              },
            ],
            synonyms: ['flame'],
            antonyms: ['water'],
          },
        ],
        sourceUrls: ['https://en.wiktionary.org/wiki/fire'],
      },
    },
    hit: {
      summary: 'HIT - resposta recuperada do Redis',
      value: {
        word: 'fire',
        phonetics: [
          {
            text: '/faɪə/',
            audio:
              'https://api.dictionaryapi.dev/media/pronunciations/en/fire-us.mp3',
          },
        ],
        meanings: [
          {
            partOfSpeech: 'noun',
            definitions: [
              {
                definition: 'Combustion or burning.',
                example: 'The fire was warm.',
                synonyms: ['blaze'],
                antonyms: ['ice'],
              },
            ],
            synonyms: ['flame'],
            antonyms: ['water'],
          },
        ],
        sourceUrls: ['https://en.wiktionary.org/wiki/fire'],
      },
    },
  });
}

function applyCacheDocumentation(
  document: OpenAPIObject,
  path: string,
  method: HttpMethod,
  examples: Record<string, ResponseExample>,
): void {
  const paths = document.paths as Record<string, PathDocumentation | undefined>;
  const operation = paths[path]?.[method];
  const okResponse = operation?.responses?.['200'];

  if (!operation || !okResponse) {
    return;
  }

  operation['x-cache'] = {
    header: 'x-cache',
    enum: ['HIT', 'MISS'],
    meanings: {
      HIT: 'Resposta recuperada do Redis.',
      MISS: 'Consulta ao PostgreSQL ou serviço externo.',
    },
  };

  okResponse.headers = {
    ...okResponse.headers,
    'x-cache': cacheHeader,
  };
  okResponse.content ??= {};
  okResponse.content['application/json'] ??= {};
  okResponse.content['application/json'].examples = examples;
}
