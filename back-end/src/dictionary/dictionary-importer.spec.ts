import { CacheService } from '../infrastructure/cache/cache.service';
import {
  chunkWords,
  fetchDictionarySource,
  importDictionaryWords,
  normalizeDictionaryWord,
  prepareDictionaryWords,
} from './dictionary-importer';

describe('dictionaryImporter', () => {
  describe('normalizeDictionaryWord', () => {
    it('should normalize words to lowercase and trim external spaces', () => {
      expect(normalizeDictionaryWord('  Fire  ')).toBe('fire');
    });

    it('should discard words with internal whitespace', () => {
      expect(normalizeDictionaryWord('ice cream')).toBeNull();
    });

    it('should discard empty words', () => {
      expect(normalizeDictionaryWord('   ')).toBeNull();
    });
  });

  describe('prepareDictionaryWords', () => {
    it('should interpret object keys as words, deduplicate, and normalize values', () => {
      const preparedWords = prepareDictionaryWords({
        Fire: 1,
        ' fire ': true,
        WATER: {},
        'ice cream': 'invalid',
        '   ': 'invalid',
      });

      expect(preparedWords).toEqual({
        receivedCount: 5,
        validCount: 2,
        words: ['fire', 'water'],
      });
    });
  });

  describe('chunkWords', () => {
    it('should split words into fixed-size batches', () => {
      expect(chunkWords(['a', 'b', 'c', 'd', 'e'], 2)).toEqual([
        ['a', 'b'],
        ['c', 'd'],
        ['e'],
      ]);
    });
  });

  describe('fetchDictionarySource', () => {
    it('should return the parsed payload when the response is successful', async () => {
      const payload = await fetchDictionarySource(
        () =>
          Promise.resolve({
            ok: true,
            status: 200,
            headers: {
              get: () => 'application/json; charset=utf-8',
            },
            json: () => Promise.resolve({ fire: 1 }),
          }),
        'https://example.com/words.json',
        10,
      );

      expect(payload).toEqual({ fire: 1 });
    });

    it('should fail when the download status is invalid', async () => {
      await expect(
        fetchDictionarySource(
          () =>
            Promise.resolve({
              ok: false,
              status: 503,
              headers: {
                get: () => 'application/json',
              },
              json: () => Promise.resolve({}),
            }),
          'https://example.com/words.json',
          10,
        ),
      ).rejects.toThrow(
        'Falha ao baixar o arquivo de palavras. Status HTTP: 503.',
      );
    });

    it('should fail when the content-type is invalid', async () => {
      await expect(
        fetchDictionarySource(
          () =>
            Promise.resolve({
              ok: true,
              status: 200,
              headers: {
                get: () => 'text/html',
              },
              json: () => Promise.resolve({ fire: 1 }),
            }),
          'https://example.com/words.json',
          10,
        ),
      ).rejects.toThrow(
        'O arquivo de palavras foi retornado com um content-type inválido.',
      );
    });
  });

  describe('importDictionaryWords', () => {
    const createPrismaClientMock = () => ({
      dictionaryWord: {
        createMany: jest.fn(),
      },
      $disconnect: jest.fn(() => Promise.resolve()),
    });

    const createCacheServiceMock = () => ({
      deleteByPattern: jest.fn<
        ReturnType<CacheService['deleteByPattern']>,
        Parameters<CacheService['deleteByPattern']>
      >(),
    });

    const createLoggerMock = () => ({
      log: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    });

    it('should import in batches and invalidate listing cache after new insertions', async () => {
      const prismaClientMock = createPrismaClientMock();
      const cacheServiceMock = createCacheServiceMock();
      const loggerMock = createLoggerMock();

      prismaClientMock.dictionaryWord.createMany
        .mockResolvedValueOnce({ count: 2 })
        .mockResolvedValueOnce({ count: 1 });
      cacheServiceMock.deleteByPattern.mockResolvedValue({
        deletedCount: 3,
        failed: false,
      });

      const summary = await importDictionaryWords({
        fetchImplementation: () =>
          Promise.resolve({
            ok: true,
            status: 200,
            headers: {
              get: () => 'application/json',
            },
            json: () =>
              Promise.resolve({
                Fire: true,
                FIRE: true,
                Water: true,
                Earth: true,
              }),
          }),
        prismaClient: prismaClientMock,
        cacheService: cacheServiceMock,
        logger: loggerMock,
      });

      expect(prismaClientMock.dictionaryWord.createMany).toHaveBeenCalledTimes(
        1,
      );
      expect(cacheServiceMock.deleteByPattern).toHaveBeenCalledWith(
        'dictionary:list:en:*',
      );
      expect(summary).toEqual({
        receivedCount: 4,
        validCount: 3,
        insertedCount: 2,
        ignoredCount: 1,
        cacheInvalidation: {
          attempted: true,
          failed: false,
          deletedCount: 3,
        },
      });
    });

    it('should be idempotent on a second execution without duplicating data', async () => {
      const prismaClientMock = createPrismaClientMock();
      const cacheServiceMock = createCacheServiceMock();
      const loggerMock = createLoggerMock();

      prismaClientMock.dictionaryWord.createMany.mockResolvedValue({
        count: 0,
      });

      const summary = await importDictionaryWords({
        fetchImplementation: () =>
          Promise.resolve({
            ok: true,
            status: 200,
            headers: {
              get: () => 'application/json',
            },
            json: () => Promise.resolve({ Fire: true, Water: true }),
          }),
        prismaClient: prismaClientMock,
        cacheService: cacheServiceMock,
        logger: loggerMock,
      });

      expect(summary.insertedCount).toBe(0);
      expect(summary.ignoredCount).toBe(2);
      expect(summary.cacheInvalidation).toEqual({
        attempted: false,
        failed: false,
        deletedCount: 0,
      });
    });

    it('should not invalidate listing cache when no new words are inserted', async () => {
      const prismaClientMock = createPrismaClientMock();
      const cacheServiceMock = createCacheServiceMock();
      const loggerMock = createLoggerMock();

      prismaClientMock.dictionaryWord.createMany.mockResolvedValue({
        count: 0,
      });

      await importDictionaryWords({
        fetchImplementation: () =>
          Promise.resolve({
            ok: true,
            status: 200,
            headers: {
              get: () => 'application/json',
            },
            json: () => Promise.resolve({ Fire: true }),
          }),
        prismaClient: prismaClientMock,
        cacheService: cacheServiceMock,
        logger: loggerMock,
      });

      expect(cacheServiceMock.deleteByPattern).not.toHaveBeenCalled();
    });

    it('should report cache invalidation failure without failing the import', async () => {
      const prismaClientMock = createPrismaClientMock();
      const cacheServiceMock = createCacheServiceMock();
      const loggerMock = createLoggerMock();

      prismaClientMock.dictionaryWord.createMany.mockResolvedValue({
        count: 1,
      });
      cacheServiceMock.deleteByPattern.mockResolvedValue({
        deletedCount: 0,
        failed: true,
      });

      const summary = await importDictionaryWords({
        fetchImplementation: () =>
          Promise.resolve({
            ok: true,
            status: 200,
            headers: {
              get: () => 'application/json',
            },
            json: () => Promise.resolve({ Fire: true }),
          }),
        prismaClient: prismaClientMock,
        cacheService: cacheServiceMock,
        logger: loggerMock,
      });

      expect(summary.cacheInvalidation).toEqual({
        attempted: true,
        failed: true,
        deletedCount: 0,
      });
      expect(loggerMock.warn).toHaveBeenCalled();
    });

    it('should fail on download errors', async () => {
      const prismaClientMock = createPrismaClientMock();
      const cacheServiceMock = createCacheServiceMock();
      const loggerMock = createLoggerMock();

      await expect(
        importDictionaryWords({
          fetchImplementation: () =>
            Promise.reject(new Error('network failed')),
          prismaClient: prismaClientMock,
          cacheService: cacheServiceMock,
          logger: loggerMock,
        }),
      ).rejects.toThrow('network failed');
    });
  });
});
