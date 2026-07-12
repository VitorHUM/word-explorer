import { AppConfigService } from '../config/app-config.service';
import { CacheService } from './cache.service';

interface RedisClientMock {
  isOpen: boolean;
  connect: jest.Mock<Promise<void>, []>;
  quit: jest.Mock<Promise<void>, []>;
  get: jest.Mock<Promise<string | null>, [string]>;
  set: jest.Mock<Promise<string>, [string, string, { EX: number }]>;
  del: jest.Mock<Promise<number>, [string]>;
  on: jest.Mock<void, [string, (error: Error) => void]>;
}

describe('CacheService', () => {
  let cacheService: CacheService;
  let redisClient: RedisClientMock;

  beforeEach(() => {
    redisClient = {
      isOpen: true,
      connect: jest.fn(() => Promise.resolve()),
      quit: jest.fn(() => Promise.resolve()),
      get: jest.fn<Promise<string | null>, [string]>(),
      set: jest.fn<Promise<string>, [string, string, { EX: number }]>(() =>
        Promise.resolve('OK'),
      ),
      del: jest.fn<Promise<number>, [string]>(() => Promise.resolve(1)),
      on: jest.fn<void, [string, (error: Error) => void]>(),
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

    cacheService = new CacheService(appConfigService);
    Object.assign(cacheService as object, {
      redisClient,
    });
  });

  it('should return a cached value on HIT', async () => {
    redisClient.get.mockResolvedValue('{"word":"fire"}');

    await expect(
      cacheService.getJson<{ word: string }>('key'),
    ).resolves.toEqual({
      word: 'fire',
    });
  });

  it('should return null on MISS', async () => {
    redisClient.get.mockResolvedValue(null);

    await expect(cacheService.getJson('key')).resolves.toBeNull();
  });

  it('should store values with TTL', async () => {
    await cacheService.setJson('key', { word: 'fire' }, 3600);

    expect(redisClient.set).toHaveBeenCalledWith(
      'key',
      JSON.stringify({ word: 'fire' }),
      { EX: 3600 },
    );
  });

  it('should treat invalid cache as MISS', async () => {
    redisClient.get.mockResolvedValue('invalid-json');

    await expect(cacheService.getJson('key')).resolves.toBeNull();
    expect(redisClient.del).toHaveBeenCalledWith('key');
  });

  it('should tolerate Redis unavailability', async () => {
    redisClient.isOpen = false;
    redisClient.connect.mockRejectedValue(new Error('connection failed'));

    await expect(cacheService.getJson('key')).resolves.toBeNull();
    await expect(
      cacheService.setJson('key', { word: 'fire' }, 3600),
    ).resolves.toBeUndefined();
  });
});
