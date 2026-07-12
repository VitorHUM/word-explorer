import { ApiProperty } from '@nestjs/swagger';

export class UserProfileDto {
  @ApiProperty({
    example: '4ec6ad59-ec9e-4064-a174-c976dff6cd1f',
    format: 'uuid',
  })
  id!: string;

  @ApiProperty({
    example: 'Usuário 1',
  })
  name!: string;

  @ApiProperty({
    example: 'example@email.com',
  })
  email!: string;

  @ApiProperty({
    example: '2024-01-01T00:00:00.000Z',
    format: 'date-time',
  })
  createdAt!: string;

  @ApiProperty({
    example: '2024-01-02T00:00:00.000Z',
    format: 'date-time',
  })
  updatedAt!: string;
}
