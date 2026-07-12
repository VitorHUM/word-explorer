import { Injectable, Logger, type NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

const SENSITIVE_FIELD_NAMES = new Set([
  'password',
  'passwordHash',
  'token',
  'authorization',
  'jwt',
  'secret',
]);

@Injectable()
export class HttpLoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(request: Request, response: Response, next: NextFunction): void {
    const { method, originalUrl, url } = request;
    const requestPath = originalUrl || url;

    const startedAt = performance.now();
    const requestBodyLog = this.buildRequestBodyLog(request);

    response.on('finish', () => {
      const { statusCode } = response;
      const elapsedMs = Math.round(performance.now() - startedAt);

      const message = [
        `${method} ${requestPath}`,
        `Status Code = ${statusCode}`,
        `Time = ${elapsedMs}ms`,
        requestBodyLog,
      ]
        .filter(Boolean)
        .join(' | ');

      if (response.statusCode >= 500) {
        this.logger.error(message);
        return;
      }

      if (response.statusCode >= 400) {
        this.logger.warn(message);
        return;
      }

      this.logger.log(message);
    });

    next();
  }

  private buildRequestBodyLog(request: Request): string | null {
    if (!this.shouldLogBody(request)) {
      return null;
    }

    const sanitizedBody = this.sanitizeValue(request.body);
    const serializedBody = JSON.stringify(sanitizedBody);

    if (!serializedBody || serializedBody === '{}') {
      return null;
    }

    const truncatedBody =
      serializedBody.length > 300
        ? `${serializedBody.slice(0, 297)}...`
        : serializedBody;

    return `Body = ${truncatedBody}`;
  }

  private shouldLogBody(request: Request): boolean {
    return ['POST', 'PUT', 'PATCH'].includes(request.method);
  }

  private sanitizeValue(value: unknown): unknown {
    if (Array.isArray(value)) {
      return value.map((entry) => this.sanitizeValue(entry));
    }

    if (value && typeof value === 'object') {
      const sanitizedObject: Record<string, unknown> = {};

      for (const [key, entryValue] of Object.entries(
        value as Record<string, unknown>,
      )) {
        sanitizedObject[key] = SENSITIVE_FIELD_NAMES.has(key.toLowerCase())
          ? '[REDACTED]'
          : this.sanitizeValue(entryValue);
      }

      return sanitizedObject;
    }

    return value;
  }
}
