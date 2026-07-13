import { Injectable } from '@nestjs/common';
import type { AuthenticatedUser } from '../../../auth/types/auth.type';
import { PrismaService } from '../prisma/prisma.service';

export interface AuthUserRecord {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
}

@Injectable()
export class UserRepository {
  constructor(private readonly prismaService: PrismaService) {}

  createAuthUser(data: {
    name: string;
    email: string;
    passwordHash: string;
  }): Promise<AuthUserRecord> {
    return this.prismaService.user.create({
      data,
      select: {
        id: true,
        name: true,
        email: true,
        passwordHash: true,
      },
    });
  }

  findAuthUserByEmail(email: string): Promise<AuthUserRecord | null> {
    return this.prismaService.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        passwordHash: true,
      },
    });
  }

  findAuthenticatedById(id: string): Promise<AuthenticatedUser | null> {
    return this.prismaService.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }
}
