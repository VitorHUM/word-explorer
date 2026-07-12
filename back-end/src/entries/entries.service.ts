import { Injectable } from '@nestjs/common';
import { PrismaService } from '../infrastructure/database/prisma/prisma.service';
import {
  ListEntriesQueryDto,
  ListEntriesResponseDto,
} from './dtos/entries.dto';

@Injectable()
export class EntriesService {
  constructor(private readonly prismaService: PrismaService) {}

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
}
