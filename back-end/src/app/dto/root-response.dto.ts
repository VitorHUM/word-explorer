import { ApiProperty } from '@nestjs/swagger';

export class RootResponseDto {
  @ApiProperty({
    example: 'English Dictionary',
  })
  message!: string;
}
