import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';
import { HealthResponseDto } from './dto/health-response.dto';
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

  @Get('health')
  @ApiOperation({
    summary: 'Verificar a saúde da API',
  })
  @ApiOkResponse({
    description: 'Indica que a API está disponível para receber requisições.',
    type: HealthResponseDto,
  })
  getHealth(): HealthResponseDto {
    return this.appService.getHealth();
  }
}
