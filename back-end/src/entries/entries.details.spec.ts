import { NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import type { AuthenticatedUser } from '../auth/types/auth.type';
import { CacheService } from '../infrastructure/cache/cache.service';
import { DictionaryWordRepository } from '../infrastructure/database/repositories/dictionary-word.repository';
import { FavoriteWordRepository } from '../infrastructure/database/repositories/favorite-word.repository';
import { WordHistoryRepository } from '../infrastructure/database/repositories/word-history.repository';
import { FreeDictionaryClient } from '../infrastructure/dictionary/free-dictionary.client';
import { EntriesService } from './entries.service';
import { FavoriteWordQueueService } from './favorite-word-queue.service';

describe('EntriesService details', () => {
  let entriesService: EntriesService;
  let cacheService: {
    get: jest.Mock;
    set: jest.Mock;
  };
  let dictionaryWordRepository: {
    findIdByValue: jest.Mock;
  };
  let wordHistoryRepository: {
    create: jest.Mock;
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
    dictionaryWordRepository = {
      findIdByValue: jest.fn(),
    };

    wordHistoryRepository = {
      create: jest.fn(),
    };

    freeDictionaryClient = {
      getEnglishEntryWithCache: jest.fn(),
    };

    cacheService = {
      get: jest.fn(),
      set: jest.fn(),
    };

    const dictionaryWordRepositoryInstance = Object.create(
      DictionaryWordRepository.prototype,
    ) as DictionaryWordRepository;

    Object.assign(dictionaryWordRepositoryInstance, dictionaryWordRepository);

    const freeDictionaryClientInstance = Object.create(
      FreeDictionaryClient.prototype,
    ) as FreeDictionaryClient;

    const cacheServiceInstance = Object.create(
      CacheService.prototype,
    ) as CacheService;
    const favoriteWordRepositoryInstance = Object.create(
      FavoriteWordRepository.prototype,
    ) as FavoriteWordRepository;
    const wordHistoryRepositoryInstance = Object.create(
      WordHistoryRepository.prototype,
    ) as WordHistoryRepository;

    Object.assign(freeDictionaryClientInstance, freeDictionaryClient);
    Object.assign(cacheServiceInstance, cacheService);
    Object.assign(wordHistoryRepositoryInstance, wordHistoryRepository);

    entriesService = new EntriesService(
      cacheServiceInstance,
      dictionaryWordRepositoryInstance,
      favoriteWordRepositoryInstance,
      wordHistoryRepositoryInstance,
      freeDictionaryClientInstance,
      Object.create(
        FavoriteWordQueueService.prototype,
      ) as FavoriteWordQueueService,
    );
  });

  it('should return a valid word with external MISS resolution', async () => {
    dictionaryWordRepository.findIdByValue.mockResolvedValue({
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
    dictionaryWordRepository.findIdByValue.mockResolvedValue({
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
    dictionaryWordRepository.findIdByValue.mockResolvedValue({
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

    expect(wordHistoryRepository.create).toHaveBeenCalledWith({
      userId: 'user-id',
      wordId: 'word-id',
    });
  });

  it('should register history on MISS', async () => {
    dictionaryWordRepository.findIdByValue.mockResolvedValue({
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

    expect(wordHistoryRepository.create).toHaveBeenCalledTimes(1);
  });

  it('should reject a word that does not exist locally', async () => {
    dictionaryWordRepository.findIdByValue.mockResolvedValue(null);

    await expect(
      entriesService.getEnglishEntryDetails(authenticatedUser, 'missing'),
    ).rejects.toThrow(
      new NotFoundException('Palavra não encontrada na base local.'),
    );
    expect(
      freeDictionaryClient.getEnglishEntryWithCache,
    ).not.toHaveBeenCalled();
    expect(wordHistoryRepository.create).not.toHaveBeenCalled();
  });

  it('should propagate external not found without creating history', async () => {
    dictionaryWordRepository.findIdByValue.mockResolvedValue({
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
    expect(wordHistoryRepository.create).not.toHaveBeenCalled();
  });

  it('should not create history on external failure', async () => {
    dictionaryWordRepository.findIdByValue.mockResolvedValue({
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
    expect(wordHistoryRepository.create).not.toHaveBeenCalled();
  });
});
