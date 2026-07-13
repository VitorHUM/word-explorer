import { Logger } from '@nestjs/common';
import 'dotenv/config';
import { CacheService } from '../infrastructure/cache/cache.service';
import { AppConfigService } from '../infrastructure/config/app-config.service';
import { validateEnvironment } from '../infrastructure/config/environment-config.validator';
import type { EnvironmentVariables } from '../infrastructure/config/environment.type';
import { createPrismaClient } from '../infrastructure/database/prisma/prisma-client.factory';

const DICTIONARY_SOURCE_URL =
  'https://raw.githubusercontent.com/dwyl/english-words/master/words_dictionary.json';
const DOWNLOAD_TIMEOUT_MS = 30_000;
const INSERT_BATCH_SIZE = 5_000;
const DICTIONARY_LIST_CACHE_PATTERN = 'dictionary:list:en:*';
const ALLOWED_CONTENT_TYPES = ['application/json', 'text/plain'];

type DictionarySource = Record<string, unknown>;

interface PreparedDictionaryWords {
  receivedCount: number;
  validCount: number;
  words: string[];
}

export interface DictionaryImportSummary {
  receivedCount: number;
  validCount: number;
  insertedCount: number;
  ignoredCount: number;
  cacheInvalidation: {
    attempted: boolean;
    failed: boolean;
    deletedCount: number;
  };
}

interface FetchLikeHeaders {
  get(name: string): string | null;
}

interface FetchLikeResponse {
  ok: boolean;
  status: number;
  headers: FetchLikeHeaders;
  json(): Promise<unknown>;
}

type FetchLike = (
  input: string,
  init?: { signal?: AbortSignal },
) => Promise<FetchLikeResponse>;

interface PrismaDictionaryWordClient {
  createMany(args: {
    data: Array<{ value: string }>;
    skipDuplicates: true;
  }): Promise<{ count: number }>;
}

interface PrismaImportClient {
  dictionaryWord: PrismaDictionaryWordClient;
  $disconnect(): Promise<void>;
}

interface DictionaryImporterDependencies {
  fetchImplementation: FetchLike;
  prismaClient: PrismaImportClient;
  cacheService: Pick<CacheService, 'deleteByPattern'>;
  logger: Pick<Logger, 'log' | 'warn' | 'error'>;
}

const logger = new Logger('DictionaryImporter');

export async function fetchDictionarySource(
  fetchImplementation: FetchLike,
  sourceUrl: string,
  timeoutMs: number,
): Promise<DictionarySource> {
  const abortController = new AbortController();
  const timeoutHandle = setTimeout(() => abortController.abort(), timeoutMs);

  try {
    const response = await fetchImplementation(sourceUrl, {
      signal: abortController.signal,
    });

    if (!response.ok) {
      throw new Error(
        `Falha ao baixar o arquivo de palavras. Status HTTP: ${response.status}.`,
      );
    }

    const contentType = response.headers.get('content-type');

    if (!isValidContentType(contentType)) {
      throw new Error(
        'O arquivo de palavras foi retornado com um content-type inválido.',
      );
    }

    const payload = await response.json();

    if (!isDictionarySource(payload)) {
      throw new Error(
        'O arquivo de palavras baixado possui um formato inválido.',
      );
    }

    return payload;
  } catch (error: unknown) {
    if (isAbortError(error)) {
      throw new Error(
        `Tempo limite excedido ao baixar o arquivo de palavras após ${timeoutMs}ms.`,
      );
    }

    throw error;
  } finally {
    clearTimeout(timeoutHandle);
  }
}

export function prepareDictionaryWords(
  source: DictionarySource,
): PreparedDictionaryWords {
  const uniqueWords = new Set<string>();
  let receivedCount = 0;

  for (const rawWord in source) {
    receivedCount += 1;

    const normalizedWord = normalizeDictionaryWord(rawWord);

    if (!normalizedWord) {
      continue;
    }

    uniqueWords.add(normalizedWord);
  }

  return {
    receivedCount,
    validCount: uniqueWords.size,
    words: Array.from(uniqueWords),
  };
}

export function normalizeDictionaryWord(word: string): string | null {
  const normalizedWord = word.trim().toLowerCase();

  if (!normalizedWord) {
    return null;
  }

  if (/\s/.test(normalizedWord)) {
    return null;
  }

  return normalizedWord;
}

export function chunkWords(words: string[], chunkSize: number): string[][] {
  const chunks: string[][] = [];

  for (let index = 0; index < words.length; index += chunkSize) {
    chunks.push(words.slice(index, index + chunkSize));
  }

  return chunks;
}

export async function importDictionaryWords(
  dependencies?: Partial<DictionaryImporterDependencies>,
): Promise<DictionaryImportSummary> {
  const environment = validateEnvironment(process.env);
  const resolvedDependencies = createDependencies(environment, dependencies);
  const {
    fetchImplementation,
    prismaClient,
    cacheService,
    logger: currentLogger,
  } = resolvedDependencies;

  try {
    currentLogger.log('Iniciando download do arquivo de palavras.');

    const source = await fetchDictionarySource(
      fetchImplementation,
      DICTIONARY_SOURCE_URL,
      DOWNLOAD_TIMEOUT_MS,
    );
    const preparedWords = prepareDictionaryWords(source);
    const wordChunks = chunkWords(preparedWords.words, INSERT_BATCH_SIZE);
    let insertedCount = 0;

    currentLogger.log(`Palavras recebidas: ${preparedWords.receivedCount}.`);
    currentLogger.log(
      `Palavras válidas após normalização: ${preparedWords.validCount}.`,
    );
    currentLogger.log(`Total de lotes para inserção: ${wordChunks.length}.`);

    for (const [index, chunk] of wordChunks.entries()) {
      const result = await prismaClient.dictionaryWord.createMany({
        data: chunk.map((word) => ({ value: word })),
        skipDuplicates: true,
      });

      insertedCount += result.count;

      currentLogger.log(
        `Lote ${index + 1}/${wordChunks.length} processado. Inseridas até agora: ${insertedCount}.`,
      );
    }

    const ignoredCount = preparedWords.validCount - insertedCount;
    const cacheInvalidation =
      insertedCount > 0
        ? await invalidateDictionaryListCache(cacheService, currentLogger)
        : {
            attempted: false,
            failed: false,
            deletedCount: 0,
          };
    const summary: DictionaryImportSummary = {
      receivedCount: preparedWords.receivedCount,
      validCount: preparedWords.validCount,
      insertedCount,
      ignoredCount,
      cacheInvalidation,
    };

    currentLogger.log('Importação finalizada com sucesso.');
    currentLogger.log(`Recebidas: ${summary.receivedCount}.`);
    currentLogger.log(`Válidas: ${summary.validCount}.`);
    currentLogger.log(`Inseridas: ${summary.insertedCount}.`);
    currentLogger.log(`Ignoradas: ${summary.ignoredCount}.`);

    if (cacheInvalidation.attempted) {
      currentLogger.log(
        `Invalidação do cache de listagem: ${cacheInvalidation.failed ? 'falhou' : 'concluída'} (${cacheInvalidation.deletedCount} chaves removidas).`,
      );
    } else {
      currentLogger.log(
        'Invalidação do cache de listagem não foi necessária, pois nenhuma palavra nova foi inserida.',
      );
    }

    if (process.env.NODE_ENV !== 'test') {
      currentLogger.log(
        'Processo concluído com sucesso! Encerrando o container...',
      );

      setTimeout(() => {
        process.exit(0);
      }, 500);
    }

    return summary;
  } finally {
    await prismaClient.$disconnect();
  }
}

function createDependencies(
  environment: EnvironmentVariables,
  overrides?: Partial<DictionaryImporterDependencies>,
): DictionaryImporterDependencies {
  return {
    fetchImplementation: overrides?.fetchImplementation ?? fetch,
    prismaClient:
      overrides?.prismaClient ??
      createPrismaImportClient(environment.DATABASE_URL),
    cacheService:
      overrides?.cacheService ?? createRuntimeCacheService(environment),
    logger: overrides?.logger ?? logger,
  };
}

function createRuntimeCacheService(
  environment: EnvironmentVariables,
): CacheService {
  const appConfigService = Object.create(
    AppConfigService.prototype,
  ) as AppConfigService;

  Object.defineProperty(appConfigService, 'redisHost', {
    value: environment.REDIS_HOST,
  });
  Object.defineProperty(appConfigService, 'redisPort', {
    value: environment.REDIS_PORT,
  });
  Object.defineProperty(appConfigService, 'redisTtlSeconds', {
    value: environment.REDIS_TTL_SECONDS,
  });

  return new CacheService(appConfigService);
}

function createPrismaImportClient(databaseUrl: string): PrismaImportClient {
  const prismaClient = createPrismaClient(databaseUrl);

  return {
    dictionaryWord: {
      createMany: (args) => prismaClient.dictionaryWord.createMany(args),
    },
    $disconnect: () => prismaClient.$disconnect(),
  };
}

async function invalidateDictionaryListCache(
  cacheService: Pick<CacheService, 'deleteByPattern'>,
  currentLogger: Pick<Logger, 'warn'>,
): Promise<DictionaryImportSummary['cacheInvalidation']> {
  const invalidationResult = await cacheService.deleteByPattern(
    DICTIONARY_LIST_CACHE_PATTERN,
  );

  if (invalidationResult.failed) {
    currentLogger.warn(
      'A invalidação do cache de listagem falhou após a importação. As próximas listagens podem permanecer temporariamente desatualizadas.',
    );
  }

  return {
    attempted: true,
    failed: invalidationResult.failed,
    deletedCount: invalidationResult.deletedCount,
  };
}

function isDictionarySource(payload: unknown): payload is DictionarySource {
  return (
    typeof payload === 'object' && payload !== null && !Array.isArray(payload)
  );
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError';
}

function isValidContentType(contentType: string | null): boolean {
  if (!contentType) {
    return false;
  }

  return ALLOWED_CONTENT_TYPES.some((allowedContentType) =>
    contentType.toLowerCase().includes(allowedContentType),
  );
}

if (require.main === module) {
  void runDictionaryImport();
}

async function runDictionaryImport(): Promise<void> {
  try {
    await importDictionaryWords();
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : 'Ocorreu um erro inesperado durante a importação das palavras.';

    logger.error(errorMessage);
    process.exitCode = 1;
  }
}
