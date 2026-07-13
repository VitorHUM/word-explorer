import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();

    if (exception instanceof HttpException) {
      response.status(exception.getStatus()).json({
        message: this.extractMessage(exception.getResponse()),
      });

      return;
    }

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      message: 'Ocorreu um erro interno no servidor.',
    });
  }

  private extractMessage(responseBody: string | object): string {
    if (typeof responseBody === 'string') {
      return responseBody;
    }

    if ('message' in responseBody) {
      const { message } = responseBody;

      if (typeof message === 'string') {
        return message;
      }

      if (Array.isArray(message)) {
        return message
          .filter((item): item is string => typeof item === 'string')
          .join('; ');
      }
    }

    return 'Não foi possível processar a requisição.';
  }
}
