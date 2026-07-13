import {
  Injectable,
  type CallHandler,
  type ExecutionContext,
  type NestInterceptor,
} from '@nestjs/common';
import type { Response } from 'express';
import { catchError, tap, throwError, type Observable } from 'rxjs';

@Injectable()
export class ResponseTimeInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const response = context.switchToHttp().getResponse<Response>();

    return next.handle().pipe(
      tap(() => {
        response.setHeader('x-response-time', this.getElapsedTime(response));
      }),
      catchError((error: unknown) => {
        response.setHeader('x-response-time', this.getElapsedTime(response));

        return throwError(() => error);
      }),
    );
  }

  private getElapsedTime(response: Response): string {
    const startedAt =
      typeof response.locals.requestStartedAt === 'number'
        ? response.locals.requestStartedAt
        : performance.now();

    return String(Math.round(performance.now() - startedAt));
  }
}
