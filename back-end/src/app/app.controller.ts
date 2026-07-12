import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';
import { RootResponseDto } from './dto/root-response.dto';

@ApiTags('Aplicação')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({
    summary: 'Obter a mensagem raiz da API',
  })
  @ApiOkResponse({
    description: 'Retorna a mensagem de identificação da API.',
    type: RootResponseDto,
  })
  getRoot(): RootResponseDto {
    return this.appService.getRootMessage();
  }
}
