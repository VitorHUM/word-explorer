import type { CallHandler, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Response } from 'express';
import { lastValueFrom, of } from 'rxjs';
import { CacheableResponseInterceptor } from './cacheable-response.interceptor';

describe('CacheableResponseInterceptor', () => {
  let reflector: { getAllAndOverride: jest.Mock };
  let interceptor: CacheableResponseInterceptor;
  let response: { setHeader: jest.Mock };

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    };
    response = {
      setHeader: jest.fn(),
    };

    const reflectorInstance = Object.create(Reflector.prototype) as Reflector;
    Object.assign(reflectorInstance, reflector);

    interceptor = new CacheableResponseInterceptor(reflectorInstance);
  });

  it('should unwrap cacheable bodies and set x-cache', async () => {
    reflector.getAllAndOverride.mockReturnValue(true);

    await expect(
      lastValueFrom(
        interceptor.intercept(
          createExecutionContext(response),
          createCallHandler({ cacheStatus: 'HIT', body: { word: 'fire' } }),
        ),
      ),
    ).resolves.toEqual({ word: 'fire' });
    expect(response.setHeader).toHaveBeenCalledWith('x-cache', 'HIT');
  });

  it('should not modify non-cacheable responses', async () => {
    reflector.getAllAndOverride.mockReturnValue(false);

    await expect(
      lastValueFrom(
        interceptor.intercept(
          createExecutionContext(response),
          createCallHandler({ cacheStatus: 'MISS', body: { word: 'fire' } }),
        ),
      ),
    ).resolves.toEqual({ cacheStatus: 'MISS', body: { word: 'fire' } });
    expect(response.setHeader).not.toHaveBeenCalled();
  });

  it('should pass through invalid cacheable payloads without x-cache', async () => {
    reflector.getAllAndOverride.mockReturnValue(true);

    await expect(
      lastValueFrom(
        interceptor.intercept(
          createExecutionContext(response),
          createCallHandler({ cacheStatus: 'STALE', body: { word: 'fire' } }),
        ),
      ),
    ).resolves.toEqual({ cacheStatus: 'STALE', body: { word: 'fire' } });
    expect(response.setHeader).not.toHaveBeenCalled();
  });
});

function createCallHandler(value: unknown): CallHandler {
  return {
    handle: () => of(value),
  };
}

function createExecutionContext(response: {
  setHeader: jest.Mock;
}): ExecutionContext {
  return {
    getHandler: () => undefined,
    getClass: () => undefined,
    switchToHttp: () => ({
      getRequest: () => undefined,
      getResponse: () => response as unknown as Response,
      getNext: () => undefined,
    }),
  } as unknown as ExecutionContext;
}
