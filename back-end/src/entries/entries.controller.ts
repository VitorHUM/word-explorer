import { Controller, Get, Param, Query, Res, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/types/auth.type';
import {
  ListEntriesQueryDto,
  ListEntriesResponseDto,
} from './dtos/entries.dto';
import { EntryDetailsDto, EntryWordParamDto } from './dtos/entry-details.dto';
import { EntriesService } from './entries.service';

@ApiTags('Entradas')
@Controller('entries')
export class EntriesController {
  constructor(private readonly entriesService: EntriesService) {}

  @Get('en')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary: 'Listar palavras em inglês',
  })
  @ApiOkResponse({
    description: 'Retorna a lista paginada de palavras do dicionário.',
    type: ListEntriesResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Falha na validação dos parâmetros da requisição.',
    content: {
      'application/json': {
        example: {
          message:
            'page deve ser maior ou igual a 1.; limit deve ser menor ou igual a 100.',
          error: 'Bad Request',
          statusCode: 400,
        },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'O token está ausente, malformado, inválido ou expirado.',
  })
  listEnglishEntries(
    @Query() query: ListEntriesQueryDto,
  ): Promise<ListEntriesResponseDto> {
    return this.entriesService.listEnglishEntries(query);
  }

  @Get('en/:word')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary: 'Obter os detalhes de uma palavra em inglês',
  })
  @ApiOkResponse({
    description: 'Retorna os detalhes da palavra solicitada.',
    type: EntryDetailsDto,
  })
  @ApiBadRequestResponse({
    description: 'Falha na validação dos parâmetros da requisição.',
  })
  @ApiUnauthorizedResponse({
    description: 'O token está ausente, malformado, inválido ou expirado.',
  })
  @ApiNotFoundResponse({
    description:
      'Palavra não encontrada na base local ou no dicionário externo.',
  })
  getEnglishEntryDetails(
    @CurrentUser() authenticatedUser: AuthenticatedUser,
    @Param() params: EntryWordParamDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<EntryDetailsDto> {
    return this.entriesService
      .getEnglishEntryDetails(authenticatedUser, params.word)
      .then((result) => {
        response.setHeader('x-cache', result.cacheStatus);

        return result.details;
      });
  }
}
