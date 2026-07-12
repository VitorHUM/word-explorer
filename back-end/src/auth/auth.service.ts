import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { compare, hash } from 'bcryptjs';
import { PrismaService } from '../infrastructure/database/prisma/prisma.service';
import { AuthTokenService } from './auth-token.service';
import { AuthResponseDto, SignInDto, SignUpDto } from './dtos/auth.dto';

interface AuthUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly authTokenService: AuthTokenService,
  ) {}

  async signUp(signUpDto: SignUpDto): Promise<AuthResponseDto> {
    const normalizedName = this.normalizeName(signUpDto.name);
    const normalizedEmail = this.normalizeEmail(signUpDto.email);
    const passwordHash = await hash(signUpDto.password, 12);

    try {
      const user = await this.prismaService.user.create({
        data: {
          name: normalizedName,
          email: normalizedEmail,
          passwordHash,
        },
        select: {
          id: true,
          name: true,
          email: true,
          passwordHash: true,
        },
      });

      return this.buildAuthResponse(user);
    } catch (error: unknown) {
      if (this.isUniqueConstraintError(error)) {
        throw new ConflictException('A user with this email already exists.');
      }

      throw error;
    }
  }

  async signIn(signInDto: SignInDto): Promise<AuthResponseDto> {
    const normalizedEmail = this.normalizeEmail(signInDto.email);
    const user = await this.prismaService.user.findUnique({
      where: {
        email: normalizedEmail,
      },
      select: {
        id: true,
        name: true,
        email: true,
        passwordHash: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const isPasswordValid = await compare(
      signInDto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    return this.buildAuthResponse(user);
  }

  private buildAuthResponse(user: AuthUser): AuthResponseDto {
    return {
      id: user.id,
      name: user.name,
      token: this.authTokenService.generateToken({
        sub: user.id,
      }),
    };
  }

  private normalizeName(name: string): string {
    return name.trim().replace(/\s+/g, ' ');
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private isUniqueConstraintError(
    error: unknown,
  ): error is Prisma.PrismaClientKnownRequestError {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError ||
      (typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'P2002')
    );
  }
}
