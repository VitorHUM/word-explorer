import type { CallHandler, ExecutionContext } from '@nestjs/common';
import type { Response } from 'express';
import { lastValueFrom, of, throwError } from 'rxjs';
import { ResponseTimeInterceptor } from './response-time.interceptor';

describe('ResponseTimeInterceptor', () => {
  let interceptor: ResponseTimeInterceptor;
  let response: { locals: Record<string, unknown>; setHeader: jest.Mock };

  beforeEach(() => {
    interceptor = new ResponseTimeInterceptor();
    response = {
      locals: {
        requestStartedAt: performance.now(),
      },
      setHeader: jest.fn(),
    };
  });

  it('should set x-response-time on successful responses', async () => {
    await expect(
      lastValueFrom(
        interceptor.intercept(
          createExecutionContext(response),
          createCallHandler(),
        ),
      ),
    ).resolves.toEqual({ ok: true });

    expect(response.setHeader).toHaveBeenCalledWith(
      'x-response-time',
      expect.stringMatching(/^\d+$/),
    );
  });

  it('should set x-response-time before rethrowing errors', async () => {
    await expect(
      lastValueFrom(
        interceptor.intercept(
          createExecutionContext(response),
          createFailingCallHandler(),
        ),
      ),
    ).rejects.toThrow('boom');

    expect(response.setHeader).toHaveBeenCalledWith(
      'x-response-time',
      expect.stringMatching(/^\d+$/),
    );
  });
});

function createCallHandler(): CallHandler {
  return {
    handle: () => of({ ok: true }),
  };
}

function createFailingCallHandler(): CallHandler {
  return {
    handle: () => throwError(() => new Error('boom')),
  };
}

function createExecutionContext(response: {
  locals: Record<string, unknown>;
  setHeader: jest.Mock;
}): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => undefined,
      getResponse: () => response as unknown as Response,
      getNext: () => undefined,
    }),
  } as ExecutionContext;
}
