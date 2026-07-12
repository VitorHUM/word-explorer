import {
  BadGatewayException,
  GatewayTimeoutException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { AppConfigService } from '../config/app-config.service';
import type {
  DictionaryDefinition,
  DictionaryMeaning,
  DictionaryPhonetic,
  FreeDictionaryApiDefinition,
  FreeDictionaryApiEntry,
  FreeDictionaryApiMeaning,
  FreeDictionaryApiPhonetic,
  FreeDictionaryResult,
} from './free-dictionary.type';

const DEFAULT_TIMEOUT_MS = 10_000;

interface FetchLikeResponse {
  ok: boolean;
  status: number;
  json(): Promise<unknown>;
}

type FetchLike = (
  input: string,
  init?: { signal?: AbortSignal },
) => Promise<FetchLikeResponse>;

@Injectable()
export class FreeDictionaryClient {
  private fetchImplementation: FetchLike = fetch;

  constructor(private readonly appConfigService: AppConfigService) {}

  setFetchImplementation(fetchImplementation: FetchLike): this {
    this.fetchImplementation = fetchImplementation;

    return this;
  }

  async getEnglishEntry(word: string): Promise<FreeDictionaryResult> {
    const requestUrl = this.buildEntryUrl(word);
    const payload = await this.fetchEntryPayload(requestUrl);

    return this.mapEntryPayload(payload);
  }

  private buildEntryUrl(word: string): string {
    const encodedWord = encodeURIComponent(word);
    const normalizedBaseUrl = this.appConfigService.dictionaryApiUrl.replace(
      /\/+$/,
      '',
    );

    return `${normalizedBaseUrl}/entries/en/${encodedWord}`;
  }

  private async fetchEntryPayload(url: string): Promise<unknown> {
    const abortController = new AbortController();
    const timeoutHandle = setTimeout(
      () => abortController.abort(),
      DEFAULT_TIMEOUT_MS,
    );

    try {
      const response = await this.fetchImplementation(url, {
        signal: abortController.signal,
      });

      if (response.status === 404) {
        throw new NotFoundException('Palavra não encontrada no dicionário.');
      }

      if (response.status >= 500) {
        throw new ServiceUnavailableException(
          'O serviço de dicionário está indisponível no momento.',
        );
      }

      if (!response.ok) {
        throw new BadGatewayException(
          'O serviço de dicionário retornou uma resposta inválida.',
        );
      }

      return await response.json();
    } catch (error: unknown) {
      if (this.isAbortError(error)) {
        throw new GatewayTimeoutException(
          'A consulta ao serviço de dicionário excedeu o tempo limite.',
        );
      }

      if (this.isNetworkError(error)) {
        throw new ServiceUnavailableException(
          'Não foi possível se comunicar com o serviço de dicionário.',
        );
      }

      throw error;
    } finally {
      clearTimeout(timeoutHandle);
    }
  }

  private mapEntryPayload(payload: unknown): FreeDictionaryResult {
    if (!this.isUnknownArray(payload) || payload.length === 0) {
      throw new BadGatewayException(
        'O serviço de dicionário retornou uma resposta inválida.',
      );
    }

    const firstEntry: unknown = payload[0];

    if (!this.isApiEntry(firstEntry)) {
      throw new BadGatewayException(
        'O serviço de dicionário retornou uma resposta inválida.',
      );
    }

    const normalizedWord = this.asNonEmptyString(firstEntry.word);

    if (!normalizedWord) {
      throw new BadGatewayException(
        'O serviço de dicionário retornou uma resposta inválida.',
      );
    }

    return {
      word: normalizedWord,
      phonetics: this.mapPhonetics(firstEntry.phonetics),
      meanings: this.mapMeanings(firstEntry.meanings),
      sourceUrls: this.mapStringList(firstEntry.sourceUrls),
    };
  }

  private mapPhonetics(phonetics: unknown): DictionaryPhonetic[] {
    if (!Array.isArray(phonetics)) {
      return [];
    }

    return phonetics
      .filter((phonetic): phonetic is FreeDictionaryApiPhonetic =>
        this.isPlainObject(phonetic),
      )
      .map((phonetic) => ({
        text: this.asNonEmptyString(phonetic.text),
        audio: this.asNonEmptyString(phonetic.audio),
      }))
      .filter((phonetic) => Boolean(phonetic.text || phonetic.audio));
  }

  private mapMeanings(meanings: unknown): DictionaryMeaning[] {
    if (!Array.isArray(meanings)) {
      return [];
    }

    return meanings
      .filter((meaning): meaning is FreeDictionaryApiMeaning =>
        this.isPlainObject(meaning),
      )
      .map((meaning) => ({
        partOfSpeech: this.asNonEmptyString(meaning.partOfSpeech),
        definitions: this.mapDefinitions(meaning.definitions),
        synonyms: this.mapStringList(meaning.synonyms),
        antonyms: this.mapStringList(meaning.antonyms),
      }))
      .filter((meaning) => meaning.definitions.length > 0);
  }

  private mapDefinitions(definitions: unknown): DictionaryDefinition[] {
    if (!Array.isArray(definitions)) {
      return [];
    }

    return definitions
      .filter((definition): definition is FreeDictionaryApiDefinition =>
        this.isPlainObject(definition),
      )
      .reduce<DictionaryDefinition[]>((mappedDefinitions, definition) => {
        const normalizedDefinition = this.asNonEmptyString(
          definition.definition,
        );

        if (!normalizedDefinition) {
          return mappedDefinitions;
        }

        mappedDefinitions.push({
          definition: normalizedDefinition,
          example: this.asNonEmptyString(definition.example),
          synonyms: this.mapStringList(definition.synonyms),
          antonyms: this.mapStringList(definition.antonyms),
        });

        return mappedDefinitions;
      }, []);
  }

  private mapStringList(value: unknown): string[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return value
      .map((entry) => this.asNonEmptyString(entry))
      .filter((entry): entry is string => Boolean(entry));
  }

  private asNonEmptyString(value: unknown): string | undefined {
    if (typeof value !== 'string') {
      return undefined;
    }

    const normalizedValue = value.trim();

    return normalizedValue || undefined;
  }

  private isApiEntry(value: unknown): value is FreeDictionaryApiEntry {
    return this.isPlainObject(value);
  }

  private isUnknownArray(value: unknown): value is unknown[] {
    return Array.isArray(value);
  }

  private isPlainObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  private isAbortError(error: unknown): boolean {
    return error instanceof Error && error.name === 'AbortError';
  }

  private isNetworkError(error: unknown): boolean {
    return error instanceof TypeError;
  }
}
