import { ApiProperty } from '@nestjs/swagger';
import {
  PaginatedResponseMetaDto,
  PaginationQueryDto,
} from '../../common/dtos/pagination.dto';

export class UserHistoryQueryDto extends PaginationQueryDto {}

export class UserHistoryItemDto {
  @ApiProperty({ example: 'fire' })
  word!: string;

  @ApiProperty({
    example: '2026-07-12T00:00:00.000Z',
    format: 'date-time',
  })
  added!: string;
}

export class UserHistoryResponseDto extends PaginatedResponseMetaDto {
  @ApiProperty({ type: [UserHistoryItemDto] })
  results!: UserHistoryItemDto[];
}
