import { Injectable } from '@nestjs/common';
import type { AuthenticatedUser } from '../auth/types/auth.type';
import { buildPaginatedResponse } from '../common/dtos/pagination.dto';
import { PrismaService } from '../infrastructure/database/prisma/prisma.service';
import {
  UserFavoritesQueryDto,
  UserFavoritesResponseDto,
} from './dtos/user-favorites.dto';
import {
  UserHistoryQueryDto,
  UserHistoryResponseDto,
} from './dtos/user-history.dto';

@Injectable()
export class UserService {
  constructor(private readonly prismaService: PrismaService) {}

  async getFavorites(
    authenticatedUser: AuthenticatedUser,
    query: UserFavoritesQueryDto,
  ): Promise<UserFavoritesResponseDto> {
    const page = query.page;
    const limit = query.limit;
    const skip = (page - 1) * limit;

    const [totalDocs, favoriteItems] = await this.prismaService.$transaction(
      async (transactionClient) => {
        const totalDocsResult = await transactionClient.favoriteWord.count({
          where: {
            userId: authenticatedUser.id,
          },
        });
        const favoritesResult = await transactionClient.favoriteWord.findMany({
          where: {
            userId: authenticatedUser.id,
          },
          select: {
            createdAt: true,
            word: {
              select: {
                value: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          skip,
          take: limit,
        });

        return [totalDocsResult, favoritesResult] as const;
      },
    );

    return buildPaginatedResponse({
      results: favoriteItems.map((favoriteItem) => ({
        word: favoriteItem.word.value,
        added: favoriteItem.createdAt.toISOString(),
      })),
      totalDocs,
      page,
      limit,
    });
  }

  async getHistory(
    authenticatedUser: AuthenticatedUser,
    query: UserHistoryQueryDto,
  ): Promise<UserHistoryResponseDto> {
    const page = query.page;
    const limit = query.limit;
    const skip = (page - 1) * limit;

    const [totalDocs, historyItems] = await this.prismaService.$transaction(
      async (transactionClient) => {
        const totalDocsResult = await transactionClient.wordHistory.count({
          where: {
            userId: authenticatedUser.id,
          },
        });
        const historyResult = await transactionClient.wordHistory.findMany({
          where: {
            userId: authenticatedUser.id,
          },
          select: {
            viewedAt: true,
            word: {
              select: {
                value: true,
              },
            },
          },
          orderBy: {
            viewedAt: 'desc',
          },
          skip,
          take: limit,
        });

        return [totalDocsResult, historyResult] as const;
      },
    );

    return buildPaginatedResponse({
      results: historyItems.map((historyItem) => ({
        word: historyItem.word.value,
        added: historyItem.viewedAt.toISOString(),
      })),
      totalDocs,
      page,
      limit,
    });
  }
}
