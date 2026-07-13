import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { AuthenticatedUser } from '../auth/types/auth.type';
import { buildPaginatedResponse } from '../common/dtos/pagination.dto';
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

    const response = buildPaginatedResponse({
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

  async favoriteWord(
    authenticatedUser: AuthenticatedUser,
    word: string,
  ): Promise<void> {
    const localWord = await this.findLocalWordOrThrow(word);

    try {
      await this.prismaService.favoriteWord.create({
        data: {
          userId: authenticatedUser.id,
          wordId: localWord.id,
        },
      });
    } catch (error: unknown) {
      if (this.isUniqueConstraintError(error)) {
        return;
      }

      throw error;
    }
  }

  async unfavoriteWord(
    authenticatedUser: AuthenticatedUser,
    word: string,
  ): Promise<void> {
    const localWord = await this.findLocalWordOrThrow(word);

    await this.prismaService.favoriteWord.deleteMany({
      where: {
        userId: authenticatedUser.id,
        wordId: localWord.id,
      },
    });
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

  private async findLocalWordOrThrow(word: string): Promise<{ id: string }> {
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

    return localWord;
  }

  private normalizeSearch(search?: string): string | undefined {
    const normalizedSearch = search?.trim().toLowerCase();

    return normalizedSearch || undefined;
  }

  private isUniqueConstraintError(
    error: unknown,
  ): error is Prisma.PrismaClientKnownRequestError {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError ||
      (typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'P2002')
    );
  }
}
