import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose, Transform } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';
import {
  PaginatedResponseMetaDto,
  PaginationQueryDto,
} from '../../common/dtos/pagination.dto';
import { serializeDto } from '../../common/utils/serialization.util';

function normalizeSearchValue(value: unknown): unknown {
  if (typeof value !== 'string') {
    return value;
  }

  const normalizedValue = value.trim().toLowerCase();

  return normalizedValue || undefined;
}

export class ListEntriesQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Termo da busca por palavra.',
    example: 'fire',
  })
  @IsOptional()
  @IsString({ message: 'search deve ser um texto.' })
  @Transform(({ value }: { value: unknown }) => normalizeSearchValue(value))
  search?: string;
}

@Exclude()
export class ListEntriesResponseDto extends PaginatedResponseMetaDto {
  @ApiProperty({
    description: 'Palavras retornadas na página atual.',
    example: ['fire', 'firefly'],
    type: [String],
  })
  @Expose()
  results!: string[];

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
    results: string[];
    totalDocs: number;
    page: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  }): ListEntriesResponseDto {
    return serializeDto(ListEntriesResponseDto, data);
  }
}
