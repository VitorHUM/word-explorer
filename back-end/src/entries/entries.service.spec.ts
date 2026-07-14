import { CacheService } from '../infrastructure/cache/cache.service';
import { DictionaryWordRepository } from '../infrastructure/database/repositories/dictionary-word.repository';
import { FavoriteWordRepository } from '../infrastructure/database/repositories/favorite-word.repository';
import { WordHistoryRepository } from '../infrastructure/database/repositories/word-history.repository';
import { FreeDictionaryClient } from '../infrastructure/dictionary/free-dictionary.client';
import { EntriesService } from './entries.service';
import { FavoriteWordQueueService } from './favorite-word-queue.service';

describe('EntriesService list', () => {
  let entriesService: EntriesService;
  let dictionaryWordRepository: {
    findPaginated: jest.Mock;
    findIdByValue: jest.Mock;
  };
  let cacheService: {
    get: jest.Mock;
    set: jest.Mock;
  };

  beforeEach(() => {
    dictionaryWordRepository = {
      findPaginated: jest.fn(),
      findIdByValue: jest.fn(),
    };

    cacheService = {
      get: jest.fn().mockResolvedValue({ status: 'MISS', data: null }),
      set: jest.fn().mockResolvedValue(undefined),
    };

    const dictionaryWordRepositoryInstance = Object.create(
      DictionaryWordRepository.prototype,
    ) as DictionaryWordRepository;

    Object.assign(dictionaryWordRepositoryInstance, dictionaryWordRepository);

    const cacheServiceInstance = Object.create(
      CacheService.prototype,
    ) as CacheService;

    Object.assign(cacheServiceInstance, cacheService);

    const freeDictionaryClientInstance = Object.create(
      FreeDictionaryClient.prototype,
    ) as FreeDictionaryClient;
    const favoriteWordRepositoryInstance = Object.create(
      FavoriteWordRepository.prototype,
    ) as FavoriteWordRepository;
    const wordHistoryRepositoryInstance = Object.create(
      WordHistoryRepository.prototype,
    ) as WordHistoryRepository;

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

  it('should return MISS on the first query and cache the response', async () => {
    dictionaryWordRepository.findPaginated.mockResolvedValue({
      totalDocs: 2,
      words: ['apple', 'banana'],
    });

    await expect(
      entriesService.listEnglishEntries({ page: 1, limit: 20 }),
    ).resolves.toEqual({
      body: {
        results: ['apple', 'banana'],
        totalDocs: 2,
        page: 1,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      },
      cacheStatus: 'MISS',
    });

    expect(cacheService.set).toHaveBeenCalledWith(
      'dictionary:list:en:search=none:page=1:limit=20',
      {
        results: ['apple', 'banana'],
        totalDocs: 2,
        page: 1,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      },
    );
  });

  it('should return HIT on an identical repeated query', async () => {
    cacheService.get.mockResolvedValue({
      status: 'HIT',
      data: {
        results: ['fire', 'firefly'],
        totalDocs: 2,
        page: 1,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      },
    });

    await expect(
      entriesService.listEnglishEntries({ search: 'fire', page: 1, limit: 20 }),
    ).resolves.toEqual({
      body: {
        results: ['fire', 'firefly'],
        totalDocs: 2,
        page: 1,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      },
      cacheStatus: 'HIT',
    });

    expect(dictionaryWordRepository.findPaginated).not.toHaveBeenCalled();
    expect(cacheService.set).not.toHaveBeenCalled();
  });

  it('should generate a different key when search changes', async () => {
    dictionaryWordRepository.findPaginated.mockResolvedValue({
      totalDocs: 0,
      words: [],
    });

    await entriesService.listEnglishEntries({
      search: 'fire',
      page: 1,
      limit: 20,
    });
    await entriesService.listEnglishEntries({
      search: 'water',
      page: 1,
      limit: 20,
    });

    expect(cacheService.get).toHaveBeenNthCalledWith(
      1,
      'dictionary:list:en:search=fire:page=1:limit=20',
    );
    expect(cacheService.get).toHaveBeenNthCalledWith(
      2,
      'dictionary:list:en:search=water:page=1:limit=20',
    );
  });

  it('should generate a different key when page changes', async () => {
    dictionaryWordRepository.findPaginated.mockResolvedValue({
      totalDocs: 0,
      words: [],
    });

    await entriesService.listEnglishEntries({ page: 1, limit: 20 });
    await entriesService.listEnglishEntries({ page: 2, limit: 20 });

    expect(cacheService.get).toHaveBeenNthCalledWith(
      1,
      'dictionary:list:en:search=none:page=1:limit=20',
    );
    expect(cacheService.get).toHaveBeenNthCalledWith(
      2,
      'dictionary:list:en:search=none:page=2:limit=20',
    );
  });

  it('should generate a different key when limit changes', async () => {
    dictionaryWordRepository.findPaginated.mockResolvedValue({
      totalDocs: 0,
      words: [],
    });

    await entriesService.listEnglishEntries({ page: 1, limit: 20 });
    await entriesService.listEnglishEntries({ page: 1, limit: 50 });

    expect(cacheService.get).toHaveBeenNthCalledWith(
      1,
      'dictionary:list:en:search=none:page=1:limit=20',
    );
    expect(cacheService.get).toHaveBeenNthCalledWith(
      2,
      'dictionary:list:en:search=none:page=1:limit=50',
    );
  });

  it('should normalize equivalent search values to the same key', async () => {
    dictionaryWordRepository.findPaginated.mockResolvedValue({
      totalDocs: 0,
      words: [],
    });

    await entriesService.listEnglishEntries({
      search: ' Fire ',
      page: 1,
      limit: 20,
    });
    await entriesService.listEnglishEntries({
      search: 'fire',
      page: 1,
      limit: 20,
    });

    expect(cacheService.get).toHaveBeenNthCalledWith(
      1,
      'dictionary:list:en:search=fire:page=1:limit=20',
    );
    expect(cacheService.get).toHaveBeenNthCalledWith(
      2,
      'dictionary:list:en:search=fire:page=1:limit=20',
    );
  });

  it('should return an empty cached result as HIT', async () => {
    cacheService.get.mockResolvedValue({
      status: 'HIT',
      data: {
        results: [],
        totalDocs: 0,
        page: 1,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      },
    });

    await expect(
      entriesService.listEnglishEntries({
        search: 'missing',
        page: 1,
        limit: 20,
      }),
    ).resolves.toEqual({
      body: {
        results: [],
        totalDocs: 0,
        page: 1,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      },
      cacheStatus: 'HIT',
    });
  });

  it('should fallback to PostgreSQL when Redis is unavailable and treat as MISS', async () => {
    cacheService.get.mockResolvedValue({ status: 'MISS', data: null });
    dictionaryWordRepository.findPaginated.mockResolvedValue({
      totalDocs: 1,
      words: ['fire'],
    });

    await expect(
      entriesService.listEnglishEntries({ search: 'fire', page: 1, limit: 20 }),
    ).resolves.toEqual({
      body: {
        results: ['fire'],
        totalDocs: 1,
        page: 1,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      },
      cacheStatus: 'MISS',
    });
  });

  it('should search by case-insensitive prefix and keep deterministic ordering', async () => {
    dictionaryWordRepository.findPaginated.mockResolvedValue({
      totalDocs: 2,
      words: ['fire', 'firefly'],
    });

    await entriesService.listEnglishEntries({
      search: 'FiRe',
      page: 1,
      limit: 20,
    });

    expect(dictionaryWordRepository.findPaginated).toHaveBeenCalledWith({
      search: 'fire',
      page: 1,
      limit: 20,
    });
  });

  it('should return correct pagination metadata', async () => {
    dictionaryWordRepository.findPaginated.mockResolvedValue({
      totalDocs: 45,
      words: ['entry-21', 'entry-22'],
    });

    await expect(
      entriesService.listEnglishEntries({ page: 2, limit: 20 }),
    ).resolves.toEqual({
      body: {
        results: ['entry-21', 'entry-22'],
        totalDocs: 45,
        page: 2,
        totalPages: 3,
        hasNext: true,
        hasPrev: true,
      },
      cacheStatus: 'MISS',
    });
  });
});
