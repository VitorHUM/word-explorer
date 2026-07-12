import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  JsonWebTokenError,
  NotBeforeError,
  TokenExpiredError,
} from 'jsonwebtoken';
import type { AccessTokenPayload } from './types/auth.type';

@Injectable()
export class AuthTokenService {
  constructor(private readonly jwtService: JwtService) {}

  generateToken(payload: AccessTokenPayload): string {
    return `Bearer ${this.jwtService.sign(payload)}`;
  }

  async verifyToken(token: string): Promise<AccessTokenPayload> {
    try {
      return await this.jwtService.verifyAsync<AccessTokenPayload>(token);
    } catch (error: unknown) {
      if (error instanceof TokenExpiredError) {
        throw new UnauthorizedException('O token expirou.');
      }

      if (
        error instanceof JsonWebTokenError ||
        error instanceof NotBeforeError
      ) {
        throw new UnauthorizedException('O token informado é inválido.');
      }

      throw error;
    }
  }
}
