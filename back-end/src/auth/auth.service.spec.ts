import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcryptjs';
import { PrismaService } from '../infrastructure/database/prisma/prisma.service';
import { AuthTokenService } from './auth-token.service';
import { AuthService } from './auth.service';

interface CreatedUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
}

interface CreateUserArgs {
  data: {
    name: string;
    email: string;
    passwordHash: string;
  };
}

interface FindUniqueUserArgs {
  where: {
    email: string;
  };
  select: {
    id: boolean;
    name: boolean;
    email: boolean;
    passwordHash: boolean;
  };
}

describe('AuthService', () => {
  let authService: AuthService;
  let prismaService: {
    user: {
      create: jest.Mock<Promise<CreatedUser>, [CreateUserArgs]>;
      findUnique: jest.Mock<Promise<CreatedUser | null>, [FindUniqueUserArgs]>;
    };
  };
  let authTokenService: AuthTokenService;
  let jwtService: { sign: jest.Mock };

  beforeEach(() => {
    prismaService = {
      user: {
        create: jest.fn<Promise<CreatedUser>, [CreateUserArgs]>(),
        findUnique: jest.fn<
          Promise<CreatedUser | null>,
          [FindUniqueUserArgs]
        >(),
      },
    };

    jwtService = {
      sign: jest.fn().mockReturnValue('mocked-token'),
    };

    const jwtServiceInstance = Object.create(
      JwtService.prototype,
    ) as JwtService;

    Object.assign(jwtServiceInstance, jwtService);

    authTokenService = new AuthTokenService(jwtServiceInstance);

    const prismaServiceInstance = Object.create(
      PrismaService.prototype,
    ) as PrismaService;

    Object.assign(prismaServiceInstance, prismaService);

    authService = new AuthService(prismaServiceInstance, authTokenService);
  });

  it('should sign up a valid user', async () => {
    prismaService.user.create.mockResolvedValue({
      id: '4ec6ad59-ec9e-4064-a174-c976dff6cd1f',
      name: 'User 1',
      email: 'example@email.com',
      passwordHash: 'hashed-password',
    });

    const result = await authService.signUp({
      name: 'User 1',
      email: 'example@email.com',
      password: 'test',
    });

    expect(result).toEqual({
      id: '4ec6ad59-ec9e-4064-a174-c976dff6cd1f',
      name: 'User 1',
      token: 'Bearer mocked-token',
    });
  });

  it('should reject duplicate email', async () => {
    prismaService.user.create.mockRejectedValue({ code: 'P2002' });

    await expect(
      authService.signUp({
        name: 'User 1',
        email: 'example@email.com',
        password: 'test',
      }),
    ).rejects.toThrow(
      new ConflictException('A user with this email already exists.'),
    );
  });

  it('should store the password exclusively as a hash', async () => {
    prismaService.user.create.mockImplementation(({ data }: CreateUserArgs) =>
      Promise.resolve({
        id: '4ec6ad59-ec9e-4064-a174-c976dff6cd1f',
        name: data.name,
        email: data.email,
        passwordHash: data.passwordHash,
      }),
    );

    await authService.signUp({
      name: 'User 1',
      email: 'example@email.com',
      password: 'test',
    });

    const createCall = prismaService.user.create.mock.calls.at(0)?.[0];

    expect(createCall).toBeDefined();

    if (!createCall) {
      throw new Error('Expected prisma user.create to be called.');
    }

    const storedPasswordHash = createCall.data.passwordHash;

    expect(storedPasswordHash).not.toBe('test');
    await expect(compare('test', storedPasswordHash)).resolves.toBe(true);
  });

  it('should not expose passwordHash in the response', async () => {
    prismaService.user.create.mockResolvedValue({
      id: '4ec6ad59-ec9e-4064-a174-c976dff6cd1f',
      name: 'User 1',
      email: 'example@email.com',
      passwordHash: 'hashed-password',
    });

    const result = await authService.signUp({
      name: 'User 1',
      email: 'example@email.com',
      password: 'test',
    });

    expect(result).not.toHaveProperty('passwordHash');
  });

  it('should normalize the email before persisting the user', async () => {
    prismaService.user.create.mockImplementation(({ data }: CreateUserArgs) =>
      Promise.resolve({
        id: '4ec6ad59-ec9e-4064-a174-c976dff6cd1f',
        name: data.name,
        email: data.email,
        passwordHash: data.passwordHash,
      }),
    );

    await authService.signUp({
      name: 'User 1',
      email: '  Example@Email.com  ',
      password: 'test',
    });

    const createCall = prismaService.user.create.mock.calls.at(0)?.[0];

    expect(createCall).toBeDefined();

    if (!createCall) {
      throw new Error('Expected prisma user.create to be called.');
    }

    expect(createCall.data.email).toBe('example@email.com');
  });

  it('should sign in a valid user', async () => {
    prismaService.user.findUnique.mockResolvedValue({
      id: '4ec6ad59-ec9e-4064-a174-c976dff6cd1f',
      name: 'User 1',
      email: 'example@email.com',
      passwordHash: await hash('test', 12),
    });

    const result = await authService.signIn({
      email: 'example@email.com',
      password: 'test',
    });

    expect(result).toEqual({
      id: '4ec6ad59-ec9e-4064-a174-c976dff6cd1f',
      name: 'User 1',
      token: 'Bearer mocked-token',
    });
  });

  it('should reject a nonexistent user with a generic credentials message', async () => {
    prismaService.user.findUnique.mockResolvedValue(null);

    await expect(
      authService.signIn({
        email: 'missing@email.com',
        password: 'test',
      }),
    ).rejects.toThrow(new UnauthorizedException('Invalid email or password.'));
  });

  it('should reject an invalid password with a generic credentials message', async () => {
    prismaService.user.findUnique.mockResolvedValue({
      id: '4ec6ad59-ec9e-4064-a174-c976dff6cd1f',
      name: 'User 1',
      email: 'example@email.com',
      passwordHash: await hash('other-password', 12),
    });

    await expect(
      authService.signIn({
        email: 'example@email.com',
        password: 'test',
      }),
    ).rejects.toThrow(new UnauthorizedException('Invalid email or password.'));
  });

  it('should normalize the email before searching for a user during sign in', async () => {
    prismaService.user.findUnique.mockResolvedValue({
      id: '4ec6ad59-ec9e-4064-a174-c976dff6cd1f',
      name: 'User 1',
      email: 'example@email.com',
      passwordHash: await hash('test', 12),
    });

    await authService.signIn({
      email: '  Example@Email.com  ',
      password: 'test',
    });

    const findUniqueCall = prismaService.user.findUnique.mock.calls.at(0)?.[0];

    expect(findUniqueCall).toBeDefined();

    if (!findUniqueCall) {
      throw new Error('Expected prisma user.findUnique to be called.');
    }

    expect(findUniqueCall.where.email).toBe('example@email.com');
  });

  it('should not expose sensitive fields in the sign in response', async () => {
    prismaService.user.findUnique.mockResolvedValue({
      id: '4ec6ad59-ec9e-4064-a174-c976dff6cd1f',
      name: 'User 1',
      email: 'example@email.com',
      passwordHash: await hash('test', 12),
    });

    const result = await authService.signIn({
      email: 'example@email.com',
      password: 'test',
    });

    expect(result).not.toHaveProperty('passwordHash');
    expect(result).not.toHaveProperty('email');
  });
});
