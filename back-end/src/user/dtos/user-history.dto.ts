import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';
import {
  PaginatedResponseMetaDto,
  PaginationQueryDto,
} from '../../common/dtos/pagination.dto';
import {
  serializeDto,
  serializeDtoArray,
} from '../../common/utils/serialization.util';

export class UserHistoryQueryDto extends PaginationQueryDto {}

@Exclude()
export class UserHistoryItemDto {
  @ApiProperty({ example: 'fire' })
  @Expose()
  word!: string;

  @ApiProperty({
    example: '2026-07-12T00:00:00.000Z',
    format: 'date-time',
  })
  @Expose()
  added!: string;

  static from(data: { word: string; added: string }): UserHistoryItemDto {
    return serializeDto(UserHistoryItemDto, data);
  }
}

@Exclude()
export class UserHistoryResponseDto extends PaginatedResponseMetaDto {
  @ApiProperty({ type: [UserHistoryItemDto] })
  @Expose()
  @Type(() => UserHistoryItemDto)
  results!: UserHistoryItemDto[];

  @Expose()
  declare totalDocs: number;

  @Expose()
  declare page: number;

  @Expose()
  declare totalPages: number;

  @Expose()
  declare hasNext: boolean;

  @Expose()
  declare hasPrev: boolean;

  static from(data: {
    results: Array<{ word: string; added: string }>;
    totalDocs: number;
    page: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  }): UserHistoryResponseDto {
    return serializeDto(UserHistoryResponseDto, {
      ...data,
      results: serializeDtoArray(UserHistoryItemDto, data.results),
    });
  }
}
