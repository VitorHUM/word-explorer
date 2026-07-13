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

const ANSI = {
  RESET: '\x1b[0m',
  WHITE: '\x1b[37m',
  BOLD: '\x1b[1m',
  UNDERLINE: '\x1b[4m',
  BLUE: '\x1b[34m',
  GREEN: '\x1b[32m',
  RED: '\x1b[31m',
  YELLOW: '\x1b[33m',
} as const;

const METHOD_COLOR: Record<string, string> = {
  GET: ANSI.BLUE,
  POST: ANSI.GREEN,
  DELETE: ANSI.RED,
};

type LogLevel = 'log' | 'warn' | 'error';

@Injectable()
export class HttpLoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(request: Request, response: Response, next: NextFunction): void {
    const { method, originalUrl, url } = request;
    const requestPath = originalUrl || url;

    const startedAt = performance.now();
    response.locals.requestStartedAt = startedAt;
    const requestBodyText = this.buildRequestBodyText(request);

    response.on('finish', () => {
      const { statusCode } = response;
      const elapsedMs = Math.round(performance.now() - startedAt);
      const cacheStatus = this.getCacheStatusLog(response);

      const level = this.resolveLevel(statusCode);
      const outerColor: string =
        level === 'error'
          ? ANSI.RED
          : level === 'warn'
            ? ANSI.YELLOW
            : ANSI.GREEN;

      const requestBodyLog = requestBodyText
        ? this.colorizeBody(requestBodyText, outerColor)
        : null;

      const message = [
        this.buildMethodPathLog(method, requestPath),
        `Status Code = ${this.colorizeStatusCode(statusCode, outerColor)}`,
        `Elapsed Time = ${elapsedMs}ms`,
        cacheStatus,
        requestBodyLog,
      ]
        .filter(Boolean)
        .join(this.pipeSeparator(outerColor));

      const finalMessage = `${message}${ANSI.RESET}`;

      if (level === 'error') {
        this.logger.error(finalMessage);
        return;
      }

      if (level === 'warn') {
        this.logger.warn(finalMessage);
        return;
      }

      this.logger.log(finalMessage);
    });

    next();
  }

  private resolveLevel(statusCode: number): LogLevel {
    if (statusCode >= 500) return 'error';
    if (statusCode >= 400) return 'warn';
    return 'log';
  }

  private pipeSeparator(outerColor: string): string {
    return ` ${ANSI.WHITE}|${outerColor || ANSI.RESET} `;
  }

  private buildMethodPathLog(method: string, requestPath: string): string {
    const color = METHOD_COLOR[method] ?? '';

    const coloredMethod = `${color}${ANSI.BOLD}${method}\x1b[22m`;
    const coloredPath = `${color}${ANSI.UNDERLINE}${requestPath}\x1b[24m`;

    return `${coloredMethod} ${coloredPath}`;
  }

  private colorizeStatusCode(statusCode: number, outerColor: string): string {
    let color: string = ANSI.GREEN;

    if (statusCode >= 500) {
      color = ANSI.RED;
    } else if (statusCode >= 400) {
      color = ANSI.YELLOW;
    }

    const restore = outerColor || ANSI.RESET;

    return `${color}${statusCode}${restore}`;
  }

  private buildRequestBodyText(request: Request): string | null {
    if (!this.shouldLogBody(request)) {
      return null;
    }

    const sanitizedBody = this.sanitizeValue(request.body);
    const serializedBody = JSON.stringify(sanitizedBody);

    if (!serializedBody || serializedBody === '{}') {
      return null;
    }

    return serializedBody.length > 300
      ? `${serializedBody.slice(0, 297)}...`
      : serializedBody;
  }

  private colorizeBody(bodyText: string, outerColor: string): string {
    const restore = outerColor || ANSI.RESET;

    return `Body = ${ANSI.WHITE}${bodyText}${restore}`;
  }

  private getCacheStatusLog(response: Response): string | null {
    const cacheHeader = response.getHeader('x-cache');

    if (cacheHeader !== 'HIT' && cacheHeader !== 'MISS') {
      return null;
    }

    const color = cacheHeader === 'HIT' ? ANSI.GREEN : ANSI.RED;

    return `Cache = ${color}${cacheHeader}${ANSI.RESET}`;
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
