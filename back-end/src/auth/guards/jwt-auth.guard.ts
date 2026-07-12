import {
  CanActivate,
  Injectable,
  UnauthorizedException,
  type ExecutionContext,
} from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma/prisma.service';
import { AuthTokenService } from '../auth-token.service';
import type {
  AuthenticatedRequest,
  AuthenticatedUser,
} from '../types/auth.type';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly authTokenService: AuthTokenService,
    private readonly prismaService: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractBearerToken(request.headers.authorization);
    const payload = await this.authTokenService.verifyToken(token);
    const authenticatedUser = await this.prismaService.user.findUnique({
      where: {
        id: payload.sub,
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!authenticatedUser) {
      throw new UnauthorizedException('Token is invalid.');
    }

    request.user = authenticatedUser satisfies AuthenticatedUser;

    return true;
  }

  private extractBearerToken(
    authorizationHeader: string | string[] | undefined,
  ): string {
    if (!authorizationHeader) {
      throw new UnauthorizedException('Authorization token is required.');
    }

    if (Array.isArray(authorizationHeader)) {
      throw new UnauthorizedException('Authorization header is malformed.');
    }

    const [scheme, token, ...rest] = authorizationHeader.split(' ');

    if (scheme !== 'Bearer' || !token || rest.length > 0) {
      throw new UnauthorizedException(
        'Authorization header must use the Bearer token format.',
      );
    }

    return token;
  }
}
