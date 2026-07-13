import { NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import type { AuthenticatedUser } from '../auth/types/auth.type';
import { PrismaService } from '../infrastructure/database/prisma/prisma.service';
import { FreeDictionaryClient } from '../infrastructure/dictionary/free-dictionary.client';
import { EntriesService } from './entries.service';

describe('EntriesService details', () => {
  let entriesService: EntriesService;
  let prismaService: {
    dictionaryWord: {
      findUnique: jest.Mock;
    };
    wordHistory: {
      create: jest.Mock;
    };
  };
  let freeDictionaryClient: {
    getEnglishEntryWithCache: jest.Mock;
  };

  const authenticatedUser: AuthenticatedUser = {
    id: 'user-id',
    name: 'User 1',
    email: 'example@email.com',
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-01-02T00:00:00.000Z'),
  };

  beforeEach(() => {
    prismaService = {
      dictionaryWord: {
        findUnique: jest.fn(),
      },
      wordHistory: {
        create: jest.fn(),
      },
    };

    freeDictionaryClient = {
      getEnglishEntryWithCache: jest.fn(),
    };

    const prismaServiceInstance = Object.create(
      PrismaService.prototype,
    ) as PrismaService;

    Object.assign(prismaServiceInstance, prismaService);

    const freeDictionaryClientInstance = Object.create(
      FreeDictionaryClient.prototype,
    ) as FreeDictionaryClient;

    Object.assign(freeDictionaryClientInstance, freeDictionaryClient);

    entriesService = new EntriesService(
      prismaServiceInstance,
      freeDictionaryClientInstance,
    );
  });

  it('should return a valid word with external MISS resolution', async () => {
    prismaService.dictionaryWord.findUnique.mockResolvedValue({
      id: 'word-id',
      value: 'fire',
    });
    freeDictionaryClient.getEnglishEntryWithCache.mockResolvedValue({
      entry: {
        word: 'fire',
        phonetics: [],
        meanings: [],
        sourceUrls: [],
      },
      cacheStatus: 'MISS',
    });

    await expect(
      entriesService.getEnglishEntryDetails(authenticatedUser, 'fire'),
    ).resolves.toEqual({
      body: {
        word: 'fire',
        phonetics: [],
        meanings: [],
        sourceUrls: [],
      },
      cacheStatus: 'MISS',
    });
  });

  it('should return a valid word with cache HIT resolution', async () => {
    prismaService.dictionaryWord.findUnique.mockResolvedValue({
      id: 'word-id',
      value: 'fire',
    });
    freeDictionaryClient.getEnglishEntryWithCache.mockResolvedValue({
      entry: {
        word: 'fire',
        phonetics: [{ text: '/faɪə/' }],
        meanings: [],
        sourceUrls: ['https://source.example/fire'],
      },
      cacheStatus: 'HIT',
    });

    await expect(
      entriesService.getEnglishEntryDetails(authenticatedUser, 'fire'),
    ).resolves.toEqual({
      body: {
        word: 'fire',
        phonetics: [{ text: '/faɪə/' }],
        meanings: [],
        sourceUrls: ['https://source.example/fire'],
      },
      cacheStatus: 'HIT',
    });
  });

  it('should register history on HIT', async () => {
    prismaService.dictionaryWord.findUnique.mockResolvedValue({
      id: 'word-id',
      value: 'fire',
    });
    freeDictionaryClient.getEnglishEntryWithCache.mockResolvedValue({
      entry: {
        word: 'fire',
        phonetics: [],
        meanings: [],
        sourceUrls: [],
      },
      cacheStatus: 'HIT',
    });

    await entriesService.getEnglishEntryDetails(authenticatedUser, 'fire');

    expect(prismaService.wordHistory.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-id',
        wordId: 'word-id',
      },
    });
  });

  it('should register history on MISS', async () => {
    prismaService.dictionaryWord.findUnique.mockResolvedValue({
      id: 'word-id',
      value: 'fire',
    });
    freeDictionaryClient.getEnglishEntryWithCache.mockResolvedValue({
      entry: {
        word: 'fire',
        phonetics: [],
        meanings: [],
        sourceUrls: [],
      },
      cacheStatus: 'MISS',
    });

    await entriesService.getEnglishEntryDetails(authenticatedUser, 'fire');

    expect(prismaService.wordHistory.create).toHaveBeenCalledTimes(1);
  });

  it('should reject a word that does not exist locally', async () => {
    prismaService.dictionaryWord.findUnique.mockResolvedValue(null);

    await expect(
      entriesService.getEnglishEntryDetails(authenticatedUser, 'missing'),
    ).rejects.toThrow(
      new NotFoundException('Palavra não encontrada na base local.'),
    );
    expect(
      freeDictionaryClient.getEnglishEntryWithCache,
    ).not.toHaveBeenCalled();
    expect(prismaService.wordHistory.create).not.toHaveBeenCalled();
  });

  it('should propagate external not found without creating history', async () => {
    prismaService.dictionaryWord.findUnique.mockResolvedValue({
      id: 'word-id',
      value: 'fire',
    });
    freeDictionaryClient.getEnglishEntryWithCache.mockRejectedValue(
      new NotFoundException('Palavra não encontrada no dicionário.'),
    );

    await expect(
      entriesService.getEnglishEntryDetails(authenticatedUser, 'fire'),
    ).rejects.toThrow(
      new NotFoundException('Palavra não encontrada no dicionário.'),
    );
    expect(prismaService.wordHistory.create).not.toHaveBeenCalled();
  });

  it('should not create history on external failure', async () => {
    prismaService.dictionaryWord.findUnique.mockResolvedValue({
      id: 'word-id',
      value: 'fire',
    });
    freeDictionaryClient.getEnglishEntryWithCache.mockRejectedValue(
      new ServiceUnavailableException(
        'O serviço de dicionário está indisponível no momento.',
      ),
    );

    await expect(
      entriesService.getEnglishEntryDetails(authenticatedUser, 'fire'),
    ).rejects.toThrow(
      new ServiceUnavailableException(
        'O serviço de dicionário está indisponível no momento.',
      ),
    );
    expect(prismaService.wordHistory.create).not.toHaveBeenCalled();
  });
});
