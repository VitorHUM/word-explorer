import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

function normalizeWhitespace(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

function normalizeNameValue(value: unknown): unknown {
  return typeof value === 'string' ? normalizeWhitespace(value) : value;
}

function normalizeEmailValue(value: unknown): unknown {
  return typeof value === 'string' ? value.trim().toLowerCase() : value;
}

export class SignUpDto {
  @ApiProperty({
    example: 'Usuário 1',
  })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }: { value: unknown }) => normalizeNameValue(value))
  name!: string;

  @ApiProperty({
    example: 'example@email.com',
  })
  @IsEmail()
  @IsNotEmpty()
  @Transform(({ value }: { value: unknown }) => normalizeEmailValue(value))
  email!: string;

  @ApiProperty({
    example: 'test',
  })
  @IsString()
  @IsNotEmpty()
  password!: string;
}

export class SignInDto {
  @ApiProperty({
    example: 'example@email.com',
  })
  @IsEmail()
  @IsNotEmpty()
  @Transform(({ value }: { value: unknown }) => normalizeEmailValue(value))
  email!: string;

  @ApiProperty({
    example: 'test',
  })
  @IsString()
  @IsNotEmpty()
  password!: string;
}

export class AuthResponseDto {
  @ApiProperty({
    example: '4ec6ad59-ec9e-4064-a174-c976dff6cd1f',
    format: 'uuid',
  })
  id!: string;

  @ApiProperty({
    example: 'Usuário 1',
  })
  name!: string;

  @ApiProperty({
    example: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.example',
  })
  token!: string;
}
