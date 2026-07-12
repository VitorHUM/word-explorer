import { Injectable, NotFoundException } from '@nestjs/common';
import type { AuthenticatedUser } from '../auth/types/auth.type';
import { PrismaService } from '../infrastructure/database/prisma/prisma.service';
import { FreeDictionaryClient } from '../infrastructure/dictionary/free-dictionary.client';
import type {
  DictionaryEntryCacheStatus,
  FreeDictionaryResult,
} from '../infrastructure/dictionary/free-dictionary.type';
import {
  ListEntriesQueryDto,
  ListEntriesResponseDto,
} from './dtos/entries.dto';
import { EntryDetailsDto } from './dtos/entry-details.dto';

@Injectable()
export class EntriesService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly freeDictionaryClient: FreeDictionaryClient,
  ) {}

  async listEnglishEntries(
    query: ListEntriesQueryDto,
  ): Promise<ListEntriesResponseDto> {
    const normalizedSearch = query.search?.trim().toLowerCase();
    const page = query.page;
    const limit = query.limit;
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

    return this.buildPaginatedResponse({
      results: words.map((word) => word.value),
      totalDocs,
      page,
      limit,
    });
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

  async getEnglishEntryDetails(
    authenticatedUser: AuthenticatedUser,
    word: string,
  ): Promise<{
    details: EntryDetailsDto;
    cacheStatus: DictionaryEntryCacheStatus;
  }> {
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
      details: this.mapEntryDetails(entryResult.entry),
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
}
