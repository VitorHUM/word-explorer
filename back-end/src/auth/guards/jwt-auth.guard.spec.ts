import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../infrastructure/database/prisma/prisma.service';
import { AuthTokenService } from '../auth-token.service';
import type { AuthenticatedRequest } from '../types/auth.type';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let authTokenService: AuthTokenService;
  let jwtService: { verifyAsync: jest.Mock; sign: jest.Mock };
  let prismaService: { user: { findUnique: jest.Mock } };

  beforeEach(() => {
    jwtService = {
      verifyAsync: jest.fn(),
      sign: jest.fn(),
    };

    const jwtServiceInstance = Object.create(
      JwtService.prototype,
    ) as JwtService;

    Object.assign(jwtServiceInstance, jwtService);

    authTokenService = new AuthTokenService(jwtServiceInstance);

    prismaService = {
      user: {
        findUnique: jest.fn(),
      },
    };

    const prismaServiceInstance = Object.create(
      PrismaService.prototype,
    ) as PrismaService;

    Object.assign(prismaServiceInstance, prismaService);

    guard = new JwtAuthGuard(authTokenService, prismaServiceInstance);
  });

  it('should allow a request with a valid bearer token and attach the user', async () => {
    const request: AuthenticatedRequest = {
      headers: {
        authorization: 'Bearer valid-token',
      },
    };

    jwtService.verifyAsync.mockResolvedValue({ sub: 'user-id' });
    prismaService.user.findUnique.mockResolvedValue({
      id: 'user-id',
      name: 'User 1',
      email: 'example@email.com',
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      updatedAt: new Date('2024-01-02T00:00:00.000Z'),
    });

    await expect(
      guard.canActivate(createExecutionContext(request)),
    ).resolves.toBe(true);
    expect(request.user).toEqual({
      id: 'user-id',
      name: 'User 1',
      email: 'example@email.com',
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      updatedAt: new Date('2024-01-02T00:00:00.000Z'),
    });
  });

  it('should reject a request without a token', async () => {
    const request: AuthenticatedRequest = {
      headers: {},
    };

    await expect(
      guard.canActivate(createExecutionContext(request)),
    ).rejects.toThrow(
      new UnauthorizedException('Authorization token is required.'),
    );
  });

  it('should reject a malformed authorization header', async () => {
    const request: AuthenticatedRequest = {
      headers: {
        authorization: 'Token invalid-token',
      },
    };

    await expect(
      guard.canActivate(createExecutionContext(request)),
    ).rejects.toThrow(
      new UnauthorizedException(
        'Authorization header must use the Bearer token format.',
      ),
    );
  });

  it('should reject an invalid token', async () => {
    const request: AuthenticatedRequest = {
      headers: {
        authorization: 'Bearer invalid-token',
      },
    };

    jwtService.verifyAsync.mockRejectedValue(
      new UnauthorizedException('Token is invalid.'),
    );

    await expect(
      guard.canActivate(createExecutionContext(request)),
    ).rejects.toThrow(new UnauthorizedException('Token is invalid.'));
  });

  it('should reject an expired token', async () => {
    const request: AuthenticatedRequest = {
      headers: {
        authorization: 'Bearer expired-token',
      },
    };

    jwtService.verifyAsync.mockRejectedValue(
      new UnauthorizedException('Token has expired.'),
    );

    await expect(
      guard.canActivate(createExecutionContext(request)),
    ).rejects.toThrow(new UnauthorizedException('Token has expired.'));
  });

  it('should reject when the token user no longer exists', async () => {
    const request: AuthenticatedRequest = {
      headers: {
        authorization: 'Bearer valid-token',
      },
    };

    jwtService.verifyAsync.mockResolvedValue({ sub: 'user-id' });
    prismaService.user.findUnique.mockResolvedValue(null);

    await expect(
      guard.canActivate(createExecutionContext(request)),
    ).rejects.toThrow(new UnauthorizedException('Token is invalid.'));
  });
});

function createExecutionContext(
  request: AuthenticatedRequest,
): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => undefined,
      getNext: () => undefined,
    }),
  } as ExecutionContext;
}
