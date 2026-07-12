import { PrismaService } from '../infrastructure/database/prisma/prisma.service';
import { EntriesService } from './entries.service';

describe('EntriesService', () => {
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

    const prismaServiceInstance = Object.create(
      PrismaService.prototype,
    ) as PrismaService;

    Object.assign(prismaServiceInstance, prismaService);

    entriesService = new EntriesService(prismaServiceInstance);
  });

  it('should list words without search using default pagination', async () => {
    transactionClient.dictionaryWord.count.mockResolvedValue(2);
    transactionClient.dictionaryWord.findMany.mockResolvedValue([
      { value: 'apple' },
      { value: 'banana' },
    ]);

    await expect(
      entriesService.listEnglishEntries({ page: 1, limit: 20 }),
    ).resolves.toEqual({
      results: ['apple', 'banana'],
      totalDocs: 2,
      page: 1,
      totalPages: 1,
      hasNext: false,
      hasPrev: false,
    });
  });

  it('should search by case-insensitive prefix', async () => {
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
  });

  it('should return correct metadata for an intermediate page', async () => {
    transactionClient.dictionaryWord.count.mockResolvedValue(45);
    transactionClient.dictionaryWord.findMany.mockResolvedValue([
      { value: 'entry-21' },
      { value: 'entry-22' },
    ]);

    await expect(
      entriesService.listEnglishEntries({ page: 2, limit: 20 }),
    ).resolves.toEqual({
      results: ['entry-21', 'entry-22'],
      totalDocs: 45,
      page: 2,
      totalPages: 3,
      hasNext: true,
      hasPrev: true,
    });
  });

  it('should return correct metadata for the first page', async () => {
    transactionClient.dictionaryWord.count.mockResolvedValue(45);
    transactionClient.dictionaryWord.findMany.mockResolvedValue([
      { value: 'a' },
    ]);

    await expect(
      entriesService.listEnglishEntries({ page: 1, limit: 20 }),
    ).resolves.toEqual({
      results: ['a'],
      totalDocs: 45,
      page: 1,
      totalPages: 3,
      hasNext: true,
      hasPrev: false,
    });
  });

  it('should return correct metadata for the last page', async () => {
    transactionClient.dictionaryWord.count.mockResolvedValue(45);
    transactionClient.dictionaryWord.findMany.mockResolvedValue([
      { value: 'z' },
    ]);

    await expect(
      entriesService.listEnglishEntries({ page: 3, limit: 20 }),
    ).resolves.toEqual({
      results: ['z'],
      totalDocs: 45,
      page: 3,
      totalPages: 3,
      hasNext: false,
      hasPrev: true,
    });
  });

  it('should return an empty deterministic response for no results', async () => {
    transactionClient.dictionaryWord.count.mockResolvedValue(0);
    transactionClient.dictionaryWord.findMany.mockResolvedValue([]);

    await expect(
      entriesService.listEnglishEntries({
        search: 'missing',
        page: 1,
        limit: 20,
      }),
    ).resolves.toEqual({
      results: [],
      totalDocs: 0,
      page: 1,
      totalPages: 0,
      hasNext: false,
      hasPrev: false,
    });
  });

  it('should request the expected offset for intermediate pages', async () => {
    transactionClient.dictionaryWord.count.mockResolvedValue(100);
    transactionClient.dictionaryWord.findMany.mockResolvedValue([]);

    await entriesService.listEnglishEntries({ page: 3, limit: 20 });

    expect(transactionClient.dictionaryWord.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 40,
        take: 20,
      }),
    );
  });

  it('should accept the maximum supported limit', async () => {
    transactionClient.dictionaryWord.count.mockResolvedValue(100);
    transactionClient.dictionaryWord.findMany.mockResolvedValue([]);

    await entriesService.listEnglishEntries({ page: 1, limit: 100 });

    expect(transactionClient.dictionaryWord.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 100,
      }),
    );
  });
});
