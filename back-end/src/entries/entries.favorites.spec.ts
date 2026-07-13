import { NotFoundException } from '@nestjs/common';
import type { AuthenticatedUser } from '../auth/types/auth.type';
import { CacheService } from '../infrastructure/cache/cache.service';
import { DictionaryWordRepository } from '../infrastructure/database/repositories/dictionary-word.repository';
import { FavoriteWordRepository } from '../infrastructure/database/repositories/favorite-word.repository';
import { WordHistoryRepository } from '../infrastructure/database/repositories/word-history.repository';
import { FreeDictionaryClient } from '../infrastructure/dictionary/free-dictionary.client';
import { EntriesService } from './entries.service';

describe('EntriesService favorites', () => {
  let entriesService: EntriesService;
  let cacheService: { get: jest.Mock; set: jest.Mock };
  let dictionaryWordRepository: { findIdByValue: jest.Mock };
  let favoriteWordRepository: {
    create: jest.Mock;
    deleteByUserAndWord: jest.Mock;
  };

  const authenticatedUser: AuthenticatedUser = {
    id: 'user-id',
    name: 'User 1',
    email: 'user@example.com',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    cacheService = {
      get: jest.fn(),
      set: jest.fn(),
    };

    dictionaryWordRepository = {
      findIdByValue: jest.fn(),
    };

    favoriteWordRepository = {
      create: jest.fn(),
      deleteByUserAndWord: jest.fn(),
    };

    const cacheServiceInstance = Object.create(
      CacheService.prototype,
    ) as CacheService;
    Object.assign(cacheServiceInstance, cacheService);

    const dictionaryWordRepositoryInstance = Object.create(
      DictionaryWordRepository.prototype,
    ) as DictionaryWordRepository;
    Object.assign(dictionaryWordRepositoryInstance, dictionaryWordRepository);

    const freeDictionaryClientInstance = Object.create(
      FreeDictionaryClient.prototype,
    ) as FreeDictionaryClient;
    const favoriteWordRepositoryInstance = Object.create(
      FavoriteWordRepository.prototype,
    ) as FavoriteWordRepository;
    const wordHistoryRepositoryInstance = Object.create(
      WordHistoryRepository.prototype,
    ) as WordHistoryRepository;
    Object.assign(favoriteWordRepositoryInstance, favoriteWordRepository);

    entriesService = new EntriesService(
      cacheServiceInstance,
      dictionaryWordRepositoryInstance,
      favoriteWordRepositoryInstance,
      wordHistoryRepositoryInstance,
      freeDictionaryClientInstance,
    );
  });

  it('should favorite a word', async () => {
    dictionaryWordRepository.findIdByValue.mockResolvedValue({
      id: 'word-id',
    });

    await expect(
      entriesService.favoriteWord(authenticatedUser, 'Fire'),
    ).resolves.toBeUndefined();

    expect(favoriteWordRepository.create).toHaveBeenCalledWith({
      userId: 'user-id',
      wordId: 'word-id',
    });
  });

  it('should favorite again idempotently on unique constraint violation', async () => {
    dictionaryWordRepository.findIdByValue.mockResolvedValue({
      id: 'word-id',
    });
    favoriteWordRepository.create.mockRejectedValue({ code: 'P2002' });

    await expect(
      entriesService.favoriteWord(authenticatedUser, 'fire'),
    ).resolves.toBeUndefined();
  });

  it('should unfavorite a word', async () => {
    dictionaryWordRepository.findIdByValue.mockResolvedValue({
      id: 'word-id',
    });
    favoriteWordRepository.deleteByUserAndWord.mockResolvedValue({ count: 1 });

    await expect(
      entriesService.unfavoriteWord(authenticatedUser, 'fire'),
    ).resolves.toBeUndefined();

    expect(favoriteWordRepository.deleteByUserAndWord).toHaveBeenCalledWith({
      userId: 'user-id',
      wordId: 'word-id',
    });
  });

  it('should unfavorite idempotently when the word is not favorited', async () => {
    dictionaryWordRepository.findIdByValue.mockResolvedValue({
      id: 'word-id',
    });
    favoriteWordRepository.deleteByUserAndWord.mockResolvedValue({ count: 0 });

    await expect(
      entriesService.unfavoriteWord(authenticatedUser, 'fire'),
    ).resolves.toBeUndefined();
  });

  it('should reject nonexistent local words', async () => {
    dictionaryWordRepository.findIdByValue.mockResolvedValue(null);

    await expect(
      entriesService.favoriteWord(authenticatedUser, 'missing'),
    ).rejects.toThrow(
      new NotFoundException('Palavra não encontrada na base local.'),
    );
  });

  it('should preserve isolation between users through the persisted userId', async () => {
    dictionaryWordRepository.findIdByValue.mockResolvedValue({
      id: 'word-id',
    });

    await entriesService.favoriteWord(
      { ...authenticatedUser, id: 'user-a' },
      'fire',
    );
    await entriesService.favoriteWord(
      { ...authenticatedUser, id: 'user-b' },
      'fire',
    );

    expect(favoriteWordRepository.create).toHaveBeenNthCalledWith(1, {
      userId: 'user-a',
      wordId: 'word-id',
    });
    expect(favoriteWordRepository.create).toHaveBeenNthCalledWith(2, {
      userId: 'user-b',
      wordId: 'word-id',
    });
  });

  it('should tolerate concurrent unique constraint violations without duplicating favorites', async () => {
    dictionaryWordRepository.findIdByValue.mockResolvedValue({
      id: 'word-id',
    });
    favoriteWordRepository.create.mockRejectedValue({ code: 'P2002' });

    await expect(
      entriesService.favoriteWord(authenticatedUser, 'fire'),
    ).resolves.toBeUndefined();
  });
});
