import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

function normalizeSearchValue(value: unknown): unknown {
  if (typeof value !== 'string') {
    return value;
  }

  const normalizedValue = value.trim().toLowerCase();

  return normalizedValue || undefined;
}

function normalizeIntegerValue(value: unknown): unknown {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'string' && value.trim()) {
    return Number(value);
  }

  return value;
}

export class ListEntriesQueryDto {
  @ApiPropertyOptional({
    description: 'Termo da busca por palavra.',
    example: 'fire',
  })
  @IsOptional()
  @IsString({ message: 'search deve ser um texto.' })
  @Transform(({ value }: { value: unknown }) => normalizeSearchValue(value))
  search?: string;

  @ApiPropertyOptional({
    description: 'Página atual da listagem.',
    example: 1,
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => normalizeIntegerValue(value))
  @IsInt({ message: 'page deve ser um número inteiro.' })
  @Min(1, { message: 'page deve ser maior ou igual a 1.' })
  page = 1;

  @ApiPropertyOptional({
    description: 'Quantidade de itens por página.',
    example: 20,
    default: 20,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => normalizeIntegerValue(value))
  @IsInt({ message: 'limit deve ser um número inteiro.' })
  @Min(1, { message: 'limit deve ser maior ou igual a 1.' })
  @Max(100, { message: 'limit deve ser menor ou igual a 100.' })
  limit = 20;
}

export class ListEntriesResponseDto {
  @ApiProperty({
    description: 'Palavras retornadas na página atual.',
    example: ['fire', 'firefly'],
    type: [String],
  })
  results!: string[];

  @ApiProperty({
    description: 'Total de palavras encontradas.',
    example: 20,
  })
  totalDocs!: number;

  @ApiProperty({
    description: 'Página atual.',
    example: 1,
  })
  page!: number;

  @ApiProperty({
    description: 'Total de páginas disponíveis.',
    example: 1,
  })
  totalPages!: number;

  @ApiProperty({
    description: 'Indica se existe próxima página.',
    example: false,
  })
  hasNext!: boolean;

  @ApiProperty({
    description: 'Indica se existe página anterior.',
    example: false,
  })
  hasPrev!: boolean;
}
