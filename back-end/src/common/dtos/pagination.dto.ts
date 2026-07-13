import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

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

export class PaginationQueryDto {
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

export class PaginatedResponseMetaDto {
  @ApiProperty({ example: 20, description: 'Total de registros encontrados.' })
  totalDocs!: number;

  @ApiProperty({ example: 1, description: 'Página atual.' })
  page!: number;

  @ApiProperty({ example: 1, description: 'Total de páginas disponíveis.' })
  totalPages!: number;

  @ApiProperty({
    example: false,
    description: 'Indica se existe próxima página.',
  })
  hasNext!: boolean;

  @ApiProperty({
    example: false,
    description: 'Indica se existe página anterior.',
  })
  hasPrev!: boolean;
}

export interface PaginatedResponse<T> {
  results: T[];
  totalDocs: number;
  page: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export function buildPaginatedResponse<T>(params: {
  results: T[];
  totalDocs: number;
  page: number;
  limit: number;
}): PaginatedResponse<T> {
  const totalPages =
    params.totalDocs === 0 ? 0 : Math.ceil(params.totalDocs / params.limit);

  return {
    results: params.results,
    totalDocs: params.totalDocs,
    page: params.page,
    totalPages,
    hasNext: totalPages > 0 && params.page < totalPages,
    hasPrev: params.page > 1 && totalPages > 0,
  };
}
