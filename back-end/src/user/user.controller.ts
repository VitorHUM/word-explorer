import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/types/auth.type';
import {
  UserFavoritesQueryDto,
  UserFavoritesResponseDto,
} from './dtos/user-favorites.dto';
import {
  UserHistoryQueryDto,
  UserHistoryResponseDto,
} from './dtos/user-history.dto';
import { UserProfileDto } from './dtos/user-profile.dto';
import { UserService } from './user.service';

@ApiTags('Usuário')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary: 'Obter o perfil do usuário autenticado',
  })
  @ApiOkResponse({
    description: 'Retorna o perfil do usuário autenticado.',
    type: UserProfileDto,
  })
  @ApiUnauthorizedResponse({
    description: 'O token está ausente, malformado, inválido ou expirado.',
    content: {
      'application/json': {
        examples: {
          semToken: {
            summary: 'Sem token',
            value: {
              message: 'O token de autorização é obrigatório.',
              error: 'Unauthorized',
              statusCode: 401,
            },
          },
          tokenInvalido: {
            summary: 'Token inválido',
            value: {
              message: 'O token informado é inválido.',
              error: 'Unauthorized',
              statusCode: 401,
            },
          },
          tokenExpirado: {
            summary: 'Token expirado',
            value: {
              message: 'O token expirou.',
              error: 'Unauthorized',
              statusCode: 401,
            },
          },
        },
      },
    },
  })
  getProfile(
    @CurrentUser() authenticatedUser: AuthenticatedUser,
  ): UserProfileDto {
    return {
      id: authenticatedUser.id,
      name: authenticatedUser.name,
      email: authenticatedUser.email,
      createdAt: authenticatedUser.createdAt.toISOString(),
      updatedAt: authenticatedUser.updatedAt.toISOString(),
    };
  }

  @Get('me/history')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary: 'Obter o histórico paginado do usuário autenticado',
  })
  @ApiOkResponse({
    description: 'Retorna o histórico paginado do usuário autenticado.',
    type: UserHistoryResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'O token está ausente, malformado, inválido ou expirado.',
  })
  getHistory(
    @CurrentUser() authenticatedUser: AuthenticatedUser,
    @Query() query: UserHistoryQueryDto,
  ): Promise<UserHistoryResponseDto> {
    return this.userService.getHistory(authenticatedUser, query);
  }

  @Get('me/favorites')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary: 'Obter os favoritos paginados do usuário autenticado',
  })
  @ApiOkResponse({
    description: 'Retorna os favoritos paginados do usuário autenticado.',
    type: UserFavoritesResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'O token está ausente, malformado, inválido ou expirado.',
  })
  getFavorites(
    @CurrentUser() authenticatedUser: AuthenticatedUser,
    @Query() query: UserFavoritesQueryDto,
  ): Promise<UserFavoritesResponseDto> {
    return this.userService.getFavorites(authenticatedUser, query);
  }
}
