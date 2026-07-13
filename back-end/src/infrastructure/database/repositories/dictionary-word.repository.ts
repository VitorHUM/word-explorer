import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DictionaryWordRepository {
  constructor(private readonly prismaService: PrismaService) {}

  findIdByValue(value: string): Promise<{ id: string } | null> {
    return this.prismaService.dictionaryWord.findUnique({
      where: { value },
      select: { id: true },
    });
  }

  async findPaginated(params: {
    search?: string;
    page: number;
    limit: number;
  }): Promise<{ totalDocs: number; words: string[] }> {
    const where = params.search
      ? {
          value: {
            startsWith: params.search,
            mode: 'insensitive' as const,
          },
        }
      : {};
    const skip = (params.page - 1) * params.limit;

    const [totalDocs, words] = await this.prismaService.$transaction(
      async (transactionClient) => {
        const totalDocsResult = await transactionClient.dictionaryWord.count({
          where,
        });
        const wordsResult = await transactionClient.dictionaryWord.findMany({
          where,
          select: { value: true },
          orderBy: { value: 'asc' },
          skip,
          take: params.limit,
        });

        return [totalDocsResult, wordsResult] as const;
      },
    );

    return {
      totalDocs,
      words: words.map((word) => word.value),
    };
  }
}
