import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { compare, hash } from 'bcryptjs';
import {
  type AuthUserRecord,
  UserRepository,
} from '../infrastructure/database/repositories/user.repository';
import { AuthTokenService } from './auth-token.service';
import { AuthResponseDto, SignInDto, SignUpDto } from './dtos/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly authTokenService: AuthTokenService,
  ) {}

  async signUp(signUpDto: SignUpDto): Promise<AuthResponseDto> {
    const normalizedName = this.normalizeName(signUpDto.name);
    const normalizedEmail = this.normalizeEmail(signUpDto.email);
    const passwordHash = await hash(signUpDto.password, 12);

    try {
      const user = await this.userRepository.createAuthUser({
        name: normalizedName,
        email: normalizedEmail,
        passwordHash,
      });

      return this.buildAuthResponse(user);
    } catch (error: unknown) {
      if (this.isUniqueConstraintError(error)) {
        throw new ConflictException(
          'Já existe um usuário cadastrado com este e-mail.',
        );
      }

      throw error;
    }
  }

  async signIn(signInDto: SignInDto): Promise<AuthResponseDto> {
    const normalizedEmail = this.normalizeEmail(signInDto.email);
    const user = await this.userRepository.findAuthUserByEmail(normalizedEmail);

    if (!user) {
      throw new UnauthorizedException('E-mail ou senha inválidos.');
    }

    const isPasswordValid = await compare(
      signInDto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('E-mail ou senha inválidos.');
    }

    return this.buildAuthResponse(user);
  }

  private buildAuthResponse(user: AuthUserRecord): AuthResponseDto {
    return AuthResponseDto.from({
      id: user.id,
      name: user.name,
      token: this.authTokenService.generateToken({
        sub: user.id,
      }),
    });
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
