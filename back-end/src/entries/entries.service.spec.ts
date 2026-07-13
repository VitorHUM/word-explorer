import { CacheService } from '../infrastructure/cache/cache.service';
import { PrismaService } from '../infrastructure/database/prisma/prisma.service';
import { FreeDictionaryClient } from '../infrastructure/dictionary/free-dictionary.client';
import { EntriesService } from './entries.service';

describe('EntriesService list', () => {
  let entriesService: EntriesService;
  let transactionClient: {
    dictionaryWord: {
      count: jest.Mock;
      findMany: jest.Mock;
    };
  };
  let prismaService: {
    $transaction: jest.Mock<
      Promise<unknown>,
      [(client: typeof transactionClient) => Promise<unknown>]
    >;
  };
  let cacheService: {
    get: jest.Mock;
    set: jest.Mock;
  };

  beforeEach(() => {
    transactionClient = {
      dictionaryWord: {
        count: jest.fn(),
        findMany: jest.fn(),
      },
    };

    prismaService = {
      $transaction: jest.fn(
        (callback: (client: typeof transactionClient) => Promise<unknown>) =>
          callback(transactionClient),
      ),
    };

    cacheService = {
      get: jest.fn().mockResolvedValue({ status: 'MISS', data: null }),
      set: jest.fn().mockResolvedValue(undefined),
    };

    const prismaServiceInstance = Object.create(
      PrismaService.prototype,
    ) as PrismaService;

    Object.assign(prismaServiceInstance, prismaService);

    const cacheServiceInstance = Object.create(
      CacheService.prototype,
    ) as CacheService;

    Object.assign(cacheServiceInstance, cacheService);

    const freeDictionaryClientInstance = Object.create(
      FreeDictionaryClient.prototype,
    ) as FreeDictionaryClient;

    entriesService = new EntriesService(
      cacheServiceInstance,
      prismaServiceInstance,
      freeDictionaryClientInstance,
    );
  });

  it('should return MISS on the first query and cache the response', async () => {
    transactionClient.dictionaryWord.count.mockResolvedValue(2);
    transactionClient.dictionaryWord.findMany.mockResolvedValue([
      { value: 'apple' },
      { value: 'banana' },
    ]);

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

    expect(prismaService.$transaction).not.toHaveBeenCalled();
    expect(cacheService.set).not.toHaveBeenCalled();
  });

  it('should generate a different key when search changes', async () => {
    transactionClient.dictionaryWord.count.mockResolvedValue(0);
    transactionClient.dictionaryWord.findMany.mockResolvedValue([]);

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
    transactionClient.dictionaryWord.count.mockResolvedValue(0);
    transactionClient.dictionaryWord.findMany.mockResolvedValue([]);

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
    transactionClient.dictionaryWord.count.mockResolvedValue(0);
    transactionClient.dictionaryWord.findMany.mockResolvedValue([]);

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
    transactionClient.dictionaryWord.count.mockResolvedValue(0);
    transactionClient.dictionaryWord.findMany.mockResolvedValue([]);

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
    transactionClient.dictionaryWord.count.mockResolvedValue(1);
    transactionClient.dictionaryWord.findMany.mockResolvedValue([
      { value: 'fire' },
    ]);

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
    transactionClient.dictionaryWord.count.mockResolvedValue(2);
    transactionClient.dictionaryWord.findMany.mockResolvedValue([
      { value: 'fire' },
      { value: 'firefly' },
    ]);

    await entriesService.listEnglishEntries({
      search: 'FiRe',
      page: 1,
      limit: 20,
    });

    expect(transactionClient.dictionaryWord.count).toHaveBeenCalledWith({
      where: {
        value: {
          startsWith: 'fire',
          mode: 'insensitive',
        },
      },
    });
    expect(transactionClient.dictionaryWord.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: {
          value: 'asc',
        },
      }),
    );
  });

  it('should return correct pagination metadata', async () => {
    transactionClient.dictionaryWord.count.mockResolvedValue(45);
    transactionClient.dictionaryWord.findMany.mockResolvedValue([
      { value: 'entry-21' },
      { value: 'entry-22' },
    ]);

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
