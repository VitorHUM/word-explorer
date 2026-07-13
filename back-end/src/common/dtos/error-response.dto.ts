import { ApiProperty } from '@nestjs/swagger';

export class ErrorResponseDto {
  @ApiProperty({
    description: 'Mensagem humanizada com o motivo da falha.',
    example: 'O token de autorização é obrigatório.',
  })
  message!: string;

  @ApiProperty({
    description: 'Descrição HTTP padrão do erro.',
    example: 'Unauthorized',
  })
  error!: string;

  @ApiProperty({
    description: 'Status code HTTP retornado.',
    example: 401,
  })
  statusCode!: number;
}
