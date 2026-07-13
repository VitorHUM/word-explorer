import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { serializeDto } from '../../common/utils/serialization.util';

@Exclude()
export class UserProfileDto {
  @ApiProperty({
    example: '4ec6ad59-ec9e-4064-a174-c976dff6cd1f',
    format: 'uuid',
  })
  @Expose()
  id!: string;

  @ApiProperty({
    example: 'Usuário 1',
  })
  @Expose()
  name!: string;

  @ApiProperty({
    example: 'example@email.com',
  })
  @Expose()
  email!: string;

  @ApiProperty({
    example: '2024-01-01T00:00:00.000Z',
    format: 'date-time',
  })
  @Expose()
  createdAt!: string;

  @ApiProperty({
    example: '2024-01-02T00:00:00.000Z',
    format: 'date-time',
  })
  @Expose()
  updatedAt!: string;

  static from(data: {
    id: string;
    name: string;
    email: string;
    createdAt: string;
    updatedAt: string;
  }): UserProfileDto {
    return serializeDto(UserProfileDto, data);
  }
}
