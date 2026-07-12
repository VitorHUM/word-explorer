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
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }: { value: unknown }) => normalizeNameValue(value))
  name!: string;

  @IsEmail()
  @IsNotEmpty()
  @Transform(({ value }: { value: unknown }) => normalizeEmailValue(value))
  email!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;
}

export class SignInDto {
  @IsEmail()
  @IsNotEmpty()
  @Transform(({ value }: { value: unknown }) => normalizeEmailValue(value))
  email!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;
}

export class AuthResponseDto {
  id!: string;
  name!: string;
  token!: string;
}
