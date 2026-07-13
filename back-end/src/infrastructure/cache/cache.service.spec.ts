import { AppConfigService } from '../config/app-config.service';
import { CacheService } from './cache.service';

interface RedisClientMock {
  isOpen: boolean;
  connect: jest.Mock<Promise<void>, []>;
  quit: jest.Mock<Promise<void>, []>;
  get: jest.Mock<Promise<string | null>, [string]>;
  set: jest.Mock<Promise<string>, [string, string, { EX: number }]>;
  del: jest.Mock<Promise<number>, [string | string[]]>;
  scanIterator: jest.Mock<
    AsyncIterable<string>,
    [{ MATCH: string; COUNT: number }]
  >;
  on: jest.Mock<void, ['error', (error: Error) => void]>;
}

async function* createAsyncKeyIterator(keys: string[]): AsyncIterable<string> {
  for (const key of keys) {
    await Promise.resolve();
    yield key;
  }
}

describe('CacheService', () => {
  let cacheService: CacheService;
  let redisClient: RedisClientMock;

  beforeEach(() => {
    redisClient = {
      isOpen: false,
      connect: jest.fn<Promise<void>, []>(() => Promise.resolve()),
      quit: jest.fn<Promise<void>, []>(() => Promise.resolve()),
      get: jest.fn<Promise<string | null>, [string]>(),
      set: jest
        .fn<Promise<string>, [string, string, { EX: number }]>()
        .mockResolvedValue('OK'),
      del: jest.fn<Promise<number>, [string | string[]]>(() =>
        Promise.resolve(1),
      ),
      scanIterator: jest.fn<
        AsyncIterable<string>,
        [{ MATCH: string; COUNT: number }]
      >(() => createAsyncKeyIterator([])),
      on: jest.fn<void, ['error', (error: Error) => void]>(),
    };

    const appConfigService = Object.create(
      AppConfigService.prototype,
    ) as AppConfigService;

    Object.defineProperty(appConfigService, 'redisHost', {
      value: '127.0.0.1',
    });
    Object.defineProperty(appConfigService, 'redisPort', {
      value: 6379,
    });
    Object.defineProperty(appConfigService, 'redisTtlSeconds', {
      value: 3600,
    });

    cacheService = new CacheService(appConfigService);
    Object.assign(cacheService as object, {
      redisClient,
    });
  });

  it('should connect on module init', async () => {
    await cacheService.onModuleInit();

    expect(redisClient.connect).toHaveBeenCalledTimes(1);
  });

  it('should return HIT when the key exists', async () => {
    redisClient.isOpen = true;
    redisClient.get.mockResolvedValue('{"word":"fire"}');

    await expect(cacheService.get<{ word: string }>('key')).resolves.toEqual({
      status: 'HIT',
      data: { word: 'fire' },
    });
  });

  it('should return MISS when the key does not exist', async () => {
    redisClient.isOpen = true;
    redisClient.get.mockResolvedValue(null);

    await expect(cacheService.get('key')).resolves.toEqual({
      status: 'MISS',
      data: null,
    });
  });

  it('should store values with TTL', async () => {
    redisClient.isOpen = true;

    await cacheService.set('key', { word: 'fire' }, 3600);

    expect(redisClient.set).toHaveBeenCalledWith(
      'key',
      JSON.stringify({ word: 'fire' }),
      { EX: 3600 },
    );
  });

  it('should treat invalid JSON as MISS', async () => {
    redisClient.isOpen = true;
    redisClient.get.mockResolvedValue('invalid-json');

    await expect(cacheService.get('key')).resolves.toEqual({
      status: 'MISS',
      data: null,
    });
    expect(redisClient.del).toHaveBeenCalledWith('key');
  });

  it('should tolerate Redis failure without throwing', async () => {
    redisClient.connect.mockRejectedValue(new Error('connection failed'));

    await expect(cacheService.get('key')).resolves.toEqual({
      status: 'MISS',
      data: null,
    });
    await expect(
      cacheService.set('key', { word: 'fire' }, 3600),
    ).resolves.toBeUndefined();
  });

  it('should remove a single key', async () => {
    redisClient.isOpen = true;

    await expect(cacheService.delete('key')).resolves.toBeUndefined();
    expect(redisClient.del).toHaveBeenCalledWith('key');
  });

  it('should remove keys by pattern', async () => {
    redisClient.isOpen = true;
    redisClient.scanIterator.mockReturnValue(
      createAsyncKeyIterator([
        'dictionary:entry:en:fire',
        'dictionary:entry:en:firefly',
      ]),
    );
    redisClient.del.mockResolvedValue(2);

    await expect(
      cacheService.deleteByPattern('dictionary:entry:en:*'),
    ).resolves.toBe(2);
    expect(redisClient.del).toHaveBeenCalledWith([
      'dictionary:entry:en:fire',
      'dictionary:entry:en:firefly',
    ]);
  });
});
