import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';
import {
  PaginatedResponseMetaDto,
  PaginationQueryDto,
} from '../../common/dtos/pagination.dto';

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

export class ListEntriesResponseDto extends PaginatedResponseMetaDto {
  @ApiProperty({
    description: 'Palavras retornadas na página atual.',
    example: ['fire', 'firefly'],
    type: [String],
  })
  results!: string[];
}
