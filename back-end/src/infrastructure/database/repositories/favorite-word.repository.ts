import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface FavoriteWordRecord {
  createdAt: Date;
  word: {
    value: string;
  };
}

@Injectable()
export class FavoriteWordRepository {
  constructor(private readonly prismaService: PrismaService) {}

  create(data: { userId: string; wordId: string }): Promise<{ id: string }> {
    return this.prismaService.favoriteWord.create({
      data,
      select: { id: true },
    });
  }

  deleteByUserAndWord(data: { userId: string; wordId: string }): Promise<{
    count: number;
  }> {
    return this.prismaService.favoriteWord.deleteMany({
      where: data,
    });
  }

  async findPaginatedByUser(params: {
    userId: string;
    page: number;
    limit: number;
  }): Promise<{ totalDocs: number; items: FavoriteWordRecord[] }> {
    const skip = (params.page - 1) * params.limit;

    const [totalDocs, items] = await this.prismaService.$transaction(
      async (transactionClient) => {
        const totalDocsResult = await transactionClient.favoriteWord.count({
          where: { userId: params.userId },
        });
        const favoritesResult = await transactionClient.favoriteWord.findMany({
          where: { userId: params.userId },
          select: {
            createdAt: true,
            word: {
              select: { value: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: params.limit,
        });

        return [totalDocsResult, favoritesResult] as const;
      },
    );

    return { totalDocs, items };
  }
}
