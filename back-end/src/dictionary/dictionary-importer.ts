import { Logger } from '@nestjs/common';
import 'dotenv/config';
import { validateEnvironment } from '../infrastructure/config/environment-config.validator';
import { createPrismaClient } from '../infrastructure/database/prisma/prisma-client.factory';

const DICTIONARY_SOURCE_URL =
  'https://raw.githubusercontent.com/dwyl/english-words/master/words_dictionary.json';
const DOWNLOAD_TIMEOUT_MS = 30_000;
const INSERT_BATCH_SIZE = 5_000;

type DictionarySource = Record<string, unknown>;

interface PreparedDictionaryWords {
  receivedCount: number;
  validCount: number;
  words: string[];
}

interface DictionaryImportSummary {
  receivedCount: number;
  validCount: number;
  insertedCount: number;
  ignoredCount: number;
}

interface FetchLikeResponse {
  ok: boolean;
  status: number;
  json(): Promise<unknown>;
}

type FetchLike = (
  input: string,
  init?: { signal?: AbortSignal },
) => Promise<FetchLikeResponse>;

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

export async function importDictionaryWords(): Promise<DictionaryImportSummary> {
  const environment = validateEnvironment(process.env);
  const prismaClient = createPrismaClient(environment.DATABASE_URL);

  try {
    logger.log('Iniciando download do arquivo de palavras.');

    const source = await fetchDictionarySource(
      fetch,
      DICTIONARY_SOURCE_URL,
      DOWNLOAD_TIMEOUT_MS,
    );
    const preparedWords = prepareDictionaryWords(source);
    const wordChunks = chunkWords(preparedWords.words, INSERT_BATCH_SIZE);
    let insertedCount = 0;

    logger.log(`Palavras recebidas: ${preparedWords.receivedCount}.`);
    logger.log(
      `Palavras válidas após normalização: ${preparedWords.validCount}.`,
    );
    logger.log(`Total de lotes para inserção: ${wordChunks.length}.`);

    for (const [index, chunk] of wordChunks.entries()) {
      const result = await prismaClient.dictionaryWord.createMany({
        data: chunk.map((word) => ({ value: word })),
        skipDuplicates: true,
      });

      insertedCount += result.count;

      logger.log(
        `Lote ${index + 1}/${wordChunks.length} processado. Inseridas até agora: ${insertedCount}.`,
      );
    }

    const ignoredCount = preparedWords.receivedCount - insertedCount;
    const summary: DictionaryImportSummary = {
      receivedCount: preparedWords.receivedCount,
      validCount: preparedWords.validCount,
      insertedCount,
      ignoredCount,
    };

    logger.log('Importação finalizada com sucesso.');
    logger.log(`Recebidas: ${summary.receivedCount}.`);
    logger.log(`Válidas: ${summary.validCount}.`);
    logger.log(`Inseridas: ${summary.insertedCount}.`);
    logger.log(`Ignoradas: ${summary.ignoredCount}.`);

    return summary;
  } finally {
    await prismaClient.$disconnect();
  }
}

function isDictionarySource(payload: unknown): payload is DictionarySource {
  return (
    typeof payload === 'object' && payload !== null && !Array.isArray(payload)
  );
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError';
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
