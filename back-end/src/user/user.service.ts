import { Injectable } from '@nestjs/common';
import type { AuthenticatedUser } from '../auth/types/auth.type';
import { buildPaginatedResponse } from '../common/dtos/pagination.dto';
import { PrismaService } from '../infrastructure/database/prisma/prisma.service';
import {
  UserHistoryQueryDto,
  UserHistoryResponseDto,
} from './dtos/user-history.dto';

@Injectable()
export class UserService {
  constructor(private readonly prismaService: PrismaService) {}

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
