import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/types/auth.type';
import { CacheableResponse } from '../infrastructure/http/cacheable-response.decorator';
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
    description:
      'A busca utiliza prefixo case-insensitive e a resposta é armazenada em cache com chave determinística baseada em search, page e limit.',
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
  @CacheableResponse()
  listEnglishEntries(@Query() query: ListEntriesQueryDto): Promise<unknown> {
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
  @CacheableResponse()
  getEnglishEntryDetails(
    @CurrentUser() authenticatedUser: AuthenticatedUser,
    @Param() params: EntryWordParamDto,
  ): Promise<unknown> {
    return this.entriesService.getEnglishEntryDetails(
      authenticatedUser,
      params.word,
    );
  }
}
