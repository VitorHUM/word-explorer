import { Injectable } from '@nestjs/common';
import type { AuthenticatedUser } from '../auth/types/auth.type';
import { buildPaginatedResponse } from '../common/dtos/pagination.dto';
import { FavoriteWordRepository } from '../infrastructure/database/repositories/favorite-word.repository';
import { WordHistoryRepository } from '../infrastructure/database/repositories/word-history.repository';
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
  constructor(
    private readonly favoriteWordRepository: FavoriteWordRepository,
    private readonly wordHistoryRepository: WordHistoryRepository,
  ) {}

  async getFavorites(
    authenticatedUser: AuthenticatedUser,
    query: UserFavoritesQueryDto,
  ): Promise<UserFavoritesResponseDto> {
    const page = query.page;
    const limit = query.limit;
    const { totalDocs, items } =
      await this.favoriteWordRepository.findPaginatedByUser({
        userId: authenticatedUser.id,
        page,
        limit,
      });

    return UserFavoritesResponseDto.from(
      buildPaginatedResponse({
        results: items.map((favoriteItem) => ({
          word: favoriteItem.word.value,
          added: favoriteItem.createdAt.toISOString(),
        })),
        totalDocs,
        page,
        limit,
      }),
    );
  }

  async getHistory(
    authenticatedUser: AuthenticatedUser,
    query: UserHistoryQueryDto,
  ): Promise<UserHistoryResponseDto> {
    const page = query.page;
    const limit = query.limit;
    const { totalDocs, items } =
      await this.wordHistoryRepository.findPaginatedByUser({
        userId: authenticatedUser.id,
        page,
        limit,
      });

    return UserHistoryResponseDto.from(
      buildPaginatedResponse({
        results: items.map((historyItem) => ({
          word: historyItem.word.value,
          added: historyItem.viewedAt.toISOString(),
        })),
        totalDocs,
        page,
        limit,
      }),
    );
  }
}
