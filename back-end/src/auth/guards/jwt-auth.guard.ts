import {
  CanActivate,
  Injectable,
  UnauthorizedException,
  type ExecutionContext,
} from '@nestjs/common';
import { UserRepository } from '../../infrastructure/database/repositories/user.repository';
import { AuthTokenService } from '../auth-token.service';
import type {
  AuthenticatedRequest,
  AuthenticatedUser,
} from '../types/auth.type';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly authTokenService: AuthTokenService,
    private readonly userRepository: UserRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractBearerToken(request.headers.authorization);
    const payload = await this.authTokenService.verifyToken(token);
    const authenticatedUser = await this.userRepository.findAuthenticatedById(
      payload.sub,
    );

    if (!authenticatedUser) {
      throw new UnauthorizedException('O token informado é inválido.');
    }

    request.user = authenticatedUser satisfies AuthenticatedUser;

    return true;
  }

  private extractBearerToken(
    authorizationHeader: string | string[] | undefined,
  ): string {
    if (!authorizationHeader) {
      throw new UnauthorizedException('O token de autorização é obrigatório.');
    }

    if (Array.isArray(authorizationHeader)) {
      throw new UnauthorizedException(
        'O cabeçalho Authorization está malformado.',
      );
    }

    const [scheme, token, ...rest] = authorizationHeader.split(' ');

    if (scheme !== 'Bearer' || !token || rest.length > 0) {
      throw new UnauthorizedException(
        'O cabeçalho Authorization deve usar o formato Bearer.',
      );
    }

    return token;
  }
}
