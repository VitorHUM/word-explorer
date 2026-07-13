import { Injectable, NotFoundException } from '@nestjs/common';
import type { AuthenticatedUser } from '../auth/types/auth.type';
import { CacheService } from '../infrastructure/cache/cache.service';
import { PrismaService } from '../infrastructure/database/prisma/prisma.service';
import { FreeDictionaryClient } from '../infrastructure/dictionary/free-dictionary.client';
import type { FreeDictionaryResult } from '../infrastructure/dictionary/free-dictionary.type';
import type { CacheableResponseBody } from '../infrastructure/http/cacheable-response.interceptor';
import {
  ListEntriesQueryDto,
  ListEntriesResponseDto,
} from './dtos/entries.dto';
import { EntryDetailsDto } from './dtos/entry-details.dto';

@Injectable()
export class EntriesService {
  constructor(
    private readonly cacheService: CacheService,
    private readonly prismaService: PrismaService,
    private readonly freeDictionaryClient: FreeDictionaryClient,
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
        body: cachedResponse.data,
        cacheStatus: cachedResponse.status,
      };
    }

    const where = normalizedSearch
      ? {
          value: {
            startsWith: normalizedSearch,
            mode: 'insensitive' as const,
          },
        }
      : {};
    const skip = (page - 1) * limit;

    const [totalDocs, words] = await this.prismaService.$transaction(
      async (transactionClient) => {
        const totalDocsResult = await transactionClient.dictionaryWord.count({
          where,
        });
        const wordsResult = await transactionClient.dictionaryWord.findMany({
          where,
          select: {
            value: true,
          },
          orderBy: {
            value: 'asc',
          },
          skip,
          take: limit,
        });

        return [totalDocsResult, wordsResult] as const;
      },
    );

    const response = this.buildPaginatedResponse({
      results: words.map((word) => word.value),
      totalDocs,
      page,
      limit,
    });

    await this.cacheService.set(cacheKey, response);

    return {
      body: response,
      cacheStatus: 'MISS',
    };
  }

  private buildPaginatedResponse(params: {
    results: string[];
    totalDocs: number;
    page: number;
    limit: number;
  }): ListEntriesResponseDto {
    const totalPages =
      params.totalDocs === 0 ? 0 : Math.ceil(params.totalDocs / params.limit);

    return {
      results: params.results,
      totalDocs: params.totalDocs,
      page: params.page,
      totalPages,
      hasNext: totalPages > 0 && params.page < totalPages,
      hasPrev: params.page > 1 && totalPages > 0,
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
    const localWord = await this.prismaService.dictionaryWord.findUnique({
      where: {
        value: normalizedWord,
      },
      select: {
        id: true,
      },
    });

    if (!localWord) {
      throw new NotFoundException('Palavra não encontrada na base local.');
    }

    const entryResult =
      await this.freeDictionaryClient.getEnglishEntryWithCache(normalizedWord);

    await this.prismaService.wordHistory.create({
      data: {
        userId: authenticatedUser.id,
        wordId: localWord.id,
      },
    });

    return {
      body: this.mapEntryDetails(entryResult.entry),
      cacheStatus: entryResult.cacheStatus,
    };
  }

  private mapEntryDetails(entryDetails: FreeDictionaryResult): EntryDetailsDto {
    return {
      word: entryDetails.word,
      phonetics: entryDetails.phonetics,
      meanings: entryDetails.meanings,
      sourceUrls: entryDetails.sourceUrls,
    };
  }

  private normalizeWord(word: string): string {
    return word.trim().toLowerCase();
  }

  private normalizeSearch(search?: string): string | undefined {
    const normalizedSearch = search?.trim().toLowerCase();

    return normalizedSearch || undefined;
  }
}
