import { ApiProperty } from '@nestjs/swagger';

export class ErrorResponseDto {
  @ApiProperty({
    description: 'Mensagem humanizada com o motivo da falha.',
    example: 'O token de autorização é obrigatório.',
  })
  message!: string;
}
