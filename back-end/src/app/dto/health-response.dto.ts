import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { serializeDto } from '../../common/utils/serialization.util';

@Exclude()
export class HealthResponseDto {
  @ApiProperty({ example: 'ok' })
  @Expose()
  status!: 'ok';

  static ok(): HealthResponseDto {
    return serializeDto(HealthResponseDto, { status: 'ok' as const });
  }
}
