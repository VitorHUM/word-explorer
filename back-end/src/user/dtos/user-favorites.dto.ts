import { ApiProperty } from '@nestjs/swagger';
import {
  PaginatedResponseMetaDto,
  PaginationQueryDto,
} from '../../common/dtos/pagination.dto';

export class UserFavoritesQueryDto extends PaginationQueryDto {}

export class UserFavoriteItemDto {
  @ApiProperty({ example: 'fire' })
  word!: string;

  @ApiProperty({
    example: '2026-07-12T00:00:00.000Z',
    format: 'date-time',
  })
  added!: string;
}

export class UserFavoritesResponseDto extends PaginatedResponseMetaDto {
  @ApiProperty({ type: [UserFavoriteItemDto] })
  results!: UserFavoriteItemDto[];
}
