import { Logger } from '@nestjs/common';
import type { Request, Response } from 'express';
import { HttpLoggingMiddleware } from './http-logging.middleware';

interface TestResponse {
  locals: Record<string, unknown>;
  statusCode: number;
  emitFinish: () => void;
  setHeader: jest.Mock;
  getHeader: jest.Mock<string | undefined, [string]>;
  on: jest.Mock<TestResponse, [string, () => void]>;
}

describe('HttpLoggingMiddleware', () => {
  let middleware: HttpLoggingMiddleware;
  let loggerLogSpy: jest.SpiedFunction<Logger['log']>;
  let loggerWarnSpy: jest.SpiedFunction<Logger['warn']>;
  let loggerErrorSpy: jest.SpiedFunction<Logger['error']>;

  beforeEach(() => {
    loggerLogSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
    loggerWarnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    loggerErrorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
    middleware = new HttpLoggingMiddleware();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should initialize request timing and x-response-time before next handlers', () => {
    const request = createRequest({ method: 'GET', url: '/user/me' });
    const response = createResponse();
    const next = jest.fn<void, []>();

    middleware.use(request, response as unknown as Response, next);

    expect(response.locals.requestStartedAt).toEqual(expect.any(Number));
    expect(response.setHeader).toHaveBeenCalledWith('x-response-time', '0');
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('should log sanitized request bodies and cache status on finish', () => {
    const request = createRequest({
      method: 'POST',
      url: '/auth/signup',
      body: {
        email: 'example@email.com',
        password: 'secret',
        nested: { token: 'jwt' },
      },
    });
    const response = createResponse({ statusCode: 201, cacheHeader: 'MISS' });

    middleware.use(
      request,
      response as unknown as Response,
      jest.fn<void, []>(),
    );
    response.emitFinish();

    expect(loggerLogSpy).toHaveBeenCalledTimes(1);
    const firstLogCall = loggerLogSpy.mock.calls.at(0);

    expect(firstLogCall).toBeDefined();

    const message = String(firstLogCall?.[0]);

    expect(message).toContain('[REDACTED]');
    expect(message).toContain('Cache =');
    expect(message).not.toContain('secret');
    expect(message).not.toContain('jwt');
    expect(loggerWarnSpy).not.toHaveBeenCalled();
    expect(loggerErrorSpy).not.toHaveBeenCalled();
  });

  it('should log 4xx responses as warnings', () => {
    const request = createRequest({ method: 'GET', url: '/user/me' });
    const response = createResponse({ statusCode: 401 });

    middleware.use(
      request,
      response as unknown as Response,
      jest.fn<void, []>(),
    );
    response.emitFinish();

    expect(loggerWarnSpy).toHaveBeenCalledTimes(1);
    expect(loggerLogSpy).not.toHaveBeenCalled();
    expect(loggerErrorSpy).not.toHaveBeenCalled();
  });
});

function createRequest(params: {
  method: string;
  url: string;
  body?: unknown;
}): Request {
  return {
    method: params.method,
    originalUrl: params.url,
    url: params.url,
    body: params.body,
  } as Request;
}

function createResponse(params?: {
  statusCode?: number;
  cacheHeader?: string;
}): TestResponse {
  let finishListener: (() => void) | undefined;
  const response: TestResponse = {
    locals: {},
    statusCode: params?.statusCode ?? 200,
    setHeader: jest.fn(),
    getHeader: jest.fn((headerName: string) =>
      headerName.toLowerCase() === 'x-cache' ? params?.cacheHeader : undefined,
    ),
    on: jest.fn((event: string, listener: () => void) => {
      if (event === 'finish') {
        finishListener = listener;
      }

      return response;
    }),
    emitFinish: () => {
      finishListener?.();
    },
  };

  return response;
}
