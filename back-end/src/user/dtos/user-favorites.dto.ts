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

export class UserFavoritesQueryDto extends PaginationQueryDto {}

@Exclude()
export class UserFavoriteItemDto {
  @ApiProperty({ example: 'fire' })
  @Expose()
  word!: string;

  @ApiProperty({
    example: '2026-07-12T00:00:00.000Z',
    format: 'date-time',
  })
  @Expose()
  added!: string;

  static from(data: { word: string; added: string }): UserFavoriteItemDto {
    return serializeDto(UserFavoriteItemDto, data);
  }
}

@Exclude()
export class UserFavoritesResponseDto extends PaginatedResponseMetaDto {
  @ApiProperty({ type: [UserFavoriteItemDto] })
  @Expose()
  @Type(() => UserFavoriteItemDto)
  results!: UserFavoriteItemDto[];

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
  }): UserFavoritesResponseDto {
    return serializeDto(UserFavoritesResponseDto, {
      ...data,
      results: serializeDtoArray(UserFavoriteItemDto, data.results),
    });
  }
}
