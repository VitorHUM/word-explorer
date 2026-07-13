import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcryptjs';
import { UserRepository } from '../infrastructure/database/repositories/user.repository';
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

describe('AuthService', () => {
  let authService: AuthService;
  let userRepository: {
    createAuthUser: jest.Mock<Promise<CreatedUser>, [CreateUserArgs['data']]>;
    findAuthUserByEmail: jest.Mock<Promise<CreatedUser | null>, [string]>;
  };
  let authTokenService: AuthTokenService;
  let jwtService: { sign: jest.Mock };

  beforeEach(() => {
    userRepository = {
      createAuthUser: jest.fn<Promise<CreatedUser>, [CreateUserArgs['data']]>(),
      findAuthUserByEmail: jest.fn<Promise<CreatedUser | null>, [string]>(),
    };

    jwtService = {
      sign: jest.fn().mockReturnValue('mocked-token'),
    };

    const jwtServiceInstance = Object.create(
      JwtService.prototype,
    ) as JwtService;

    Object.assign(jwtServiceInstance, jwtService);

    authTokenService = new AuthTokenService(jwtServiceInstance);

    const userRepositoryInstance = Object.create(
      UserRepository.prototype,
    ) as UserRepository;

    Object.assign(userRepositoryInstance, userRepository);

    authService = new AuthService(userRepositoryInstance, authTokenService);
  });

  it('should sign up a valid user', async () => {
    userRepository.createAuthUser.mockResolvedValue({
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
    userRepository.createAuthUser.mockRejectedValue({ code: 'P2002' });

    await expect(
      authService.signUp({
        name: 'User 1',
        email: 'example@email.com',
        password: 'test',
      }),
    ).rejects.toThrow(
      new ConflictException('Já existe um usuário cadastrado com este e-mail.'),
    );
  });

  it('should store the password exclusively as a hash', async () => {
    userRepository.createAuthUser.mockImplementation((data) =>
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

    const createCall = userRepository.createAuthUser.mock.calls.at(0)?.[0];

    expect(createCall).toBeDefined();

    if (!createCall) {
      throw new Error('Expected userRepository.createAuthUser to be called.');
    }

    const storedPasswordHash = createCall.passwordHash;

    expect(storedPasswordHash).not.toBe('test');
    await expect(compare('test', storedPasswordHash)).resolves.toBe(true);
  });

  it('should not expose passwordHash in the response', async () => {
    userRepository.createAuthUser.mockResolvedValue({
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
    userRepository.createAuthUser.mockImplementation((data) =>
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

    const createCall = userRepository.createAuthUser.mock.calls.at(0)?.[0];

    expect(createCall).toBeDefined();

    if (!createCall) {
      throw new Error('Expected userRepository.createAuthUser to be called.');
    }

    expect(createCall.email).toBe('example@email.com');
  });

  it('should sign in a valid user', async () => {
    userRepository.findAuthUserByEmail.mockResolvedValue({
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
    userRepository.findAuthUserByEmail.mockResolvedValue(null);

    await expect(
      authService.signIn({
        email: 'missing@email.com',
        password: 'test',
      }),
    ).rejects.toThrow(new UnauthorizedException('E-mail ou senha inválidos.'));
  });

  it('should reject an invalid password with a generic credentials message', async () => {
    userRepository.findAuthUserByEmail.mockResolvedValue({
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
    ).rejects.toThrow(new UnauthorizedException('E-mail ou senha inválidos.'));
  });

  it('should normalize the email before searching for a user during sign in', async () => {
    userRepository.findAuthUserByEmail.mockResolvedValue({
      id: '4ec6ad59-ec9e-4064-a174-c976dff6cd1f',
      name: 'User 1',
      email: 'example@email.com',
      passwordHash: await hash('test', 12),
    });

    await authService.signIn({
      email: '  Example@Email.com  ',
      password: 'test',
    });

    const findByEmailCall =
      userRepository.findAuthUserByEmail.mock.calls.at(0)?.[0];

    expect(findByEmailCall).toBeDefined();

    if (!findByEmailCall) {
      throw new Error(
        'Expected userRepository.findAuthUserByEmail to be called.',
      );
    }

    expect(findByEmailCall).toBe('example@email.com');
  });

  it('should not expose sensitive fields in the sign in response', async () => {
    userRepository.findAuthUserByEmail.mockResolvedValue({
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
