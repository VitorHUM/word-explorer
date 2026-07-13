import { NotFoundException } from '@nestjs/common';
import type { AuthenticatedUser } from '../auth/types/auth.type';
import { CacheService } from '../infrastructure/cache/cache.service';
import { PrismaService } from '../infrastructure/database/prisma/prisma.service';
import { FreeDictionaryClient } from '../infrastructure/dictionary/free-dictionary.client';
import { EntriesService } from './entries.service';

describe('EntriesService favorites', () => {
  let entriesService: EntriesService;
  let cacheService: { get: jest.Mock; set: jest.Mock };
  let prismaService: {
    dictionaryWord: { findUnique: jest.Mock };
    favoriteWord: {
      create: jest.Mock;
      deleteMany: jest.Mock;
      count: jest.Mock;
    };
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

    prismaService = {
      dictionaryWord: {
        findUnique: jest.fn(),
      },
      favoriteWord: {
        create: jest.fn(),
        deleteMany: jest.fn(),
        count: jest.fn(),
      },
    };

    const cacheServiceInstance = Object.create(
      CacheService.prototype,
    ) as CacheService;
    Object.assign(cacheServiceInstance, cacheService);

    const prismaServiceInstance = Object.create(
      PrismaService.prototype,
    ) as PrismaService;
    Object.assign(prismaServiceInstance, prismaService);

    const freeDictionaryClientInstance = Object.create(
      FreeDictionaryClient.prototype,
    ) as FreeDictionaryClient;

    entriesService = new EntriesService(
      cacheServiceInstance,
      prismaServiceInstance,
      freeDictionaryClientInstance,
    );
  });

  it('should favorite a word', async () => {
    prismaService.dictionaryWord.findUnique.mockResolvedValue({
      id: 'word-id',
    });

    await expect(
      entriesService.favoriteWord(authenticatedUser, 'Fire'),
    ).resolves.toBeUndefined();

    expect(prismaService.favoriteWord.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-id',
        wordId: 'word-id',
      },
    });
  });

  it('should favorite again idempotently on unique constraint violation', async () => {
    prismaService.dictionaryWord.findUnique.mockResolvedValue({
      id: 'word-id',
    });
    prismaService.favoriteWord.create.mockRejectedValue({ code: 'P2002' });

    await expect(
      entriesService.favoriteWord(authenticatedUser, 'fire'),
    ).resolves.toBeUndefined();
  });

  it('should unfavorite a word', async () => {
    prismaService.dictionaryWord.findUnique.mockResolvedValue({
      id: 'word-id',
    });
    prismaService.favoriteWord.deleteMany.mockResolvedValue({ count: 1 });

    await expect(
      entriesService.unfavoriteWord(authenticatedUser, 'fire'),
    ).resolves.toBeUndefined();

    expect(prismaService.favoriteWord.deleteMany).toHaveBeenCalledWith({
      where: {
        userId: 'user-id',
        wordId: 'word-id',
      },
    });
  });

  it('should unfavorite idempotently when the word is not favorited', async () => {
    prismaService.dictionaryWord.findUnique.mockResolvedValue({
      id: 'word-id',
    });
    prismaService.favoriteWord.deleteMany.mockResolvedValue({ count: 0 });

    await expect(
      entriesService.unfavoriteWord(authenticatedUser, 'fire'),
    ).resolves.toBeUndefined();
  });

  it('should reject nonexistent local words', async () => {
    prismaService.dictionaryWord.findUnique.mockResolvedValue(null);

    await expect(
      entriesService.favoriteWord(authenticatedUser, 'missing'),
    ).rejects.toThrow(
      new NotFoundException('Palavra não encontrada na base local.'),
    );
  });

  it('should preserve isolation between users through the persisted userId', async () => {
    prismaService.dictionaryWord.findUnique.mockResolvedValue({
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

    expect(prismaService.favoriteWord.create).toHaveBeenNthCalledWith(1, {
      data: {
        userId: 'user-a',
        wordId: 'word-id',
      },
    });
    expect(prismaService.favoriteWord.create).toHaveBeenNthCalledWith(2, {
      data: {
        userId: 'user-b',
        wordId: 'word-id',
      },
    });
  });

  it('should tolerate concurrent unique constraint violations without duplicating favorites', async () => {
    prismaService.dictionaryWord.findUnique.mockResolvedValue({
      id: 'word-id',
    });
    prismaService.favoriteWord.create.mockRejectedValue({ code: 'P2002' });

    await expect(
      entriesService.favoriteWord(authenticatedUser, 'fire'),
    ).resolves.toBeUndefined();
  });
});
