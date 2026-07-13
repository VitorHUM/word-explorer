import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface WordHistoryRecord {
  viewedAt: Date;
  word: {
    value: string;
  };
}

@Injectable()
export class WordHistoryRepository {
  constructor(private readonly prismaService: PrismaService) {}

  create(data: { userId: string; wordId: string }): Promise<{ id: string }> {
    return this.prismaService.wordHistory.create({
      data,
      select: { id: true },
    });
  }

  async findPaginatedByUser(params: {
    userId: string;
    page: number;
    limit: number;
  }): Promise<{ totalDocs: number; items: WordHistoryRecord[] }> {
    const skip = (params.page - 1) * params.limit;

    const [totalDocs, items] = await this.prismaService.$transaction(
      async (transactionClient) => {
        const totalDocsResult = await transactionClient.wordHistory.count({
          where: { userId: params.userId },
        });
        const historyResult = await transactionClient.wordHistory.findMany({
          where: { userId: params.userId },
          select: {
            viewedAt: true,
            word: {
              select: { value: true },
            },
          },
          orderBy: { viewedAt: 'desc' },
          skip,
          take: params.limit,
        });

        return [totalDocsResult, historyResult] as const;
      },
    );

    return { totalDocs, items };
  }
}
