import {
  Injectable,
  type CallHandler,
  type ExecutionContext,
  type NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Response } from 'express';
import { map, type Observable } from 'rxjs';
import type { CacheStatus } from '../cache/cache.service';
import { CACHEABLE_RESPONSE_METADATA_KEY } from './cacheable-response.decorator';

export interface CacheableResponseBody<T> {
  cacheStatus: CacheStatus;
  body: T;
}

@Injectable()
export class CacheableResponseInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const isCacheableResponse = this.reflector.getAllAndOverride<boolean>(
      CACHEABLE_RESPONSE_METADATA_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!isCacheableResponse) {
      return next.handle();
    }

    const response = context.switchToHttp().getResponse<Response>();

    return next.handle().pipe(
      map((value: unknown) => {
        if (!this.isCacheableResponseBody(value)) {
          return value;
        }

        response.setHeader('x-cache', value.cacheStatus);

        return value.body;
      }),
    );
  }

  private isCacheableResponseBody<T>(
    value: unknown,
  ): value is CacheableResponseBody<T> {
    if (!value || typeof value !== 'object') {
      return false;
    }

    if (!('cacheStatus' in value) || !('body' in value)) {
      return false;
    }

    return value.cacheStatus === 'HIT' || value.cacheStatus === 'MISS';
  }
}
