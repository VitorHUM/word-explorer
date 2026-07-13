import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { serializeDto } from '../../common/utils/serialization.util';

@Exclude()
export class RootResponseDto {
  @ApiProperty({
    example: 'English Dictionary',
  })
  @Expose()
  message!: string;

  static fromMessage(message: string): RootResponseDto {
    return serializeDto(RootResponseDto, { message });
  }
}
