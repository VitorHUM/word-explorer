import { Injectable, NotFoundException } from '@nestjs/common';
import type { AuthenticatedUser } from '../auth/types/auth.type';
import { buildPaginatedResponse } from '../common/dtos/pagination.dto';
import { CacheService } from '../infrastructure/cache/cache.service';
import { DictionaryWordRepository } from '../infrastructure/database/repositories/dictionary-word.repository';
import { FavoriteWordRepository } from '../infrastructure/database/repositories/favorite-word.repository';
import { WordHistoryRepository } from '../infrastructure/database/repositories/word-history.repository';
import { FreeDictionaryClient } from '../infrastructure/dictionary/free-dictionary.client';
import type { FreeDictionaryResult } from '../infrastructure/dictionary/free-dictionary.type';
import type { CacheableResponseBody } from '../infrastructure/http/cacheable-response.interceptor';
import {
  ListEntriesQueryDto,
  ListEntriesResponseDto,
} from './dtos/entries.dto';
import { EntryDetailsDto } from './dtos/entry-details.dto';
import { FavoriteWordQueueService } from './favorite-word-queue.service';

@Injectable()
export class EntriesService {
  constructor(
    private readonly cacheService: CacheService,
    private readonly dictionaryWordRepository: DictionaryWordRepository,
    private readonly favoriteWordRepository: FavoriteWordRepository,
    private readonly wordHistoryRepository: WordHistoryRepository,
    private readonly freeDictionaryClient: FreeDictionaryClient,
    private readonly favoriteWordQueueService: FavoriteWordQueueService,
  ) {}

  async listEnglishEntries(
    query: ListEntriesQueryDto,
  ): Promise<CacheableResponseBody<ListEntriesResponseDto>> {
    const normalizedSearch = this.normalizeSearch(query.search);
    const page = query.page;
    const limit = query.limit;
    const cacheKey = this.buildListCacheKey({
      normalizedSearch,
      page,
      limit,
    });
    const cachedResponse =
      await this.cacheService.get<ListEntriesResponseDto>(cacheKey);

    if (cachedResponse.data) {
      return {
        body: ListEntriesResponseDto.from(cachedResponse.data),
        cacheStatus: cachedResponse.status,
      };
    }

    const { totalDocs, words } =
      await this.dictionaryWordRepository.findPaginated({
        search: normalizedSearch,
        page,
        limit,
      });

    const response = buildPaginatedResponse({
      results: words,
      totalDocs,
      page,
      limit,
    });
    const serializedResponse = ListEntriesResponseDto.from(response);

    await this.cacheService.set(cacheKey, serializedResponse);

    return {
      body: serializedResponse,
      cacheStatus: 'MISS',
    };
  }

  private buildListCacheKey(params: {
    normalizedSearch?: string;
    page: number;
    limit: number;
  }): string {
    const searchToken = params.normalizedSearch ?? 'none';

    return `dictionary:list:en:search=${searchToken}:page=${params.page}:limit=${params.limit}`;
  }

  async getEnglishEntryDetails(
    authenticatedUser: AuthenticatedUser,
    word: string,
  ): Promise<CacheableResponseBody<EntryDetailsDto>> {
    const normalizedWord = this.normalizeWord(word);
    const localWord =
      await this.dictionaryWordRepository.findIdByValue(normalizedWord);

    if (!localWord) {
      throw new NotFoundException('Palavra não encontrada na base local.');
    }

    const entryResult =
      await this.freeDictionaryClient.getEnglishEntryWithCache(normalizedWord);

    await this.wordHistoryRepository.create({
      userId: authenticatedUser.id,
      wordId: localWord.id,
    });

    return {
      body: this.mapEntryDetails(entryResult.entry),
      cacheStatus: entryResult.cacheStatus,
    };
  }

  async favoriteWord(
    authenticatedUser: AuthenticatedUser,
    word: string,
  ): Promise<void> {
    const localWord = await this.findLocalWordOrThrow(word);

    await this.favoriteWordQueueService.enqueue({
      action: 'favorite',
      userId: authenticatedUser.id,
      wordId: localWord.id,
    });
  }

  async unfavoriteWord(
    authenticatedUser: AuthenticatedUser,
    word: string,
  ): Promise<void> {
    const localWord = await this.findLocalWordOrThrow(word);

    await this.favoriteWordQueueService.enqueue({
      action: 'unfavorite',
      userId: authenticatedUser.id,
      wordId: localWord.id,
    });
  }

  private mapEntryDetails(entryDetails: FreeDictionaryResult): EntryDetailsDto {
    return EntryDetailsDto.from({
      word: entryDetails.word,
      phonetics: entryDetails.phonetics,
      meanings: entryDetails.meanings,
      sourceUrls: entryDetails.sourceUrls,
    });
  }

  private normalizeWord(word: string): string {
    return word.trim().toLowerCase();
  }

  private async findLocalWordOrThrow(word: string): Promise<{ id: string }> {
    const normalizedWord = this.normalizeWord(word);
    const localWord =
      await this.dictionaryWordRepository.findIdByValue(normalizedWord);

    if (!localWord) {
      throw new NotFoundException('Palavra não encontrada na base local.');
    }

    return localWord;
  }

  private normalizeSearch(search?: string): string | undefined {
    const normalizedSearch = search?.trim().toLowerCase();

    return normalizedSearch || undefined;
  }
}
