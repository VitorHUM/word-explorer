import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  ListEntriesQueryDto,
  ListEntriesResponseDto,
} from './dtos/entries.dto';
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
}
