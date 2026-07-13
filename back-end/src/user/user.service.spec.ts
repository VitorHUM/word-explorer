import type { AuthenticatedUser } from '../auth/types/auth.type';
import { PrismaService } from '../infrastructure/database/prisma/prisma.service';
import { UserService } from './user.service';

describe('UserService', () => {
  let userService: UserService;
  let transactionClient: {
    wordHistory: {
      count: jest.Mock;
      findMany: jest.Mock;
    };
  };
  let prismaService: {
    $transaction: jest.Mock<
      Promise<unknown>,
      [(client: typeof transactionClient) => Promise<unknown>]
    >;
  };

  const authenticatedUser: AuthenticatedUser = {
    id: 'user-id',
    name: 'User 1',
    email: 'user@example.com',
    createdAt: new Date('2026-07-12T00:00:00.000Z'),
    updatedAt: new Date('2026-07-12T00:00:00.000Z'),
  };

  beforeEach(() => {
    transactionClient = {
      wordHistory: {
        count: jest.fn(),
        findMany: jest.fn(),
      },
    };

    prismaService = {
      $transaction: jest.fn(
        (callback: (client: typeof transactionClient) => Promise<unknown>) =>
          callback(transactionClient),
      ),
    };

    const prismaServiceInstance = Object.create(
      PrismaService.prototype,
    ) as PrismaService;

    Object.assign(prismaServiceInstance, prismaService);

    userService = new UserService(prismaServiceInstance);
  });

  it('should return an empty history', async () => {
    transactionClient.wordHistory.count.mockResolvedValue(0);
    transactionClient.wordHistory.findMany.mockResolvedValue([]);

    await expect(
      userService.getHistory(authenticatedUser, { page: 1, limit: 20 }),
    ).resolves.toEqual({
      results: [],
      totalDocs: 0,
      page: 1,
      totalPages: 0,
      hasNext: false,
      hasPrev: false,
    });
  });

  it('should return multiple history records', async () => {
    transactionClient.wordHistory.count.mockResolvedValue(2);
    transactionClient.wordHistory.findMany.mockResolvedValue([
      {
        viewedAt: new Date('2026-07-12T10:00:00.000Z'),
        word: { value: 'fire' },
      },
      {
        viewedAt: new Date('2026-07-12T09:00:00.000Z'),
        word: { value: 'firefly' },
      },
    ]);

    await expect(
      userService.getHistory(authenticatedUser, { page: 1, limit: 20 }),
    ).resolves.toEqual({
      results: [
        { word: 'fire', added: '2026-07-12T10:00:00.000Z' },
        { word: 'firefly', added: '2026-07-12T09:00:00.000Z' },
      ],
      totalDocs: 2,
      page: 1,
      totalPages: 1,
      hasNext: false,
      hasPrev: false,
    });
  });

  it('should order by most recent access first', async () => {
    transactionClient.wordHistory.count.mockResolvedValue(2);
    transactionClient.wordHistory.findMany.mockResolvedValue([]);

    await userService.getHistory(authenticatedUser, { page: 1, limit: 20 });

    expect(transactionClient.wordHistory.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: {
          viewedAt: 'desc',
        },
      }),
    );
  });

  it('should paginate correctly', async () => {
    transactionClient.wordHistory.count.mockResolvedValue(45);
    transactionClient.wordHistory.findMany.mockResolvedValue([
      {
        viewedAt: new Date('2026-07-12T08:00:00.000Z'),
        word: { value: 'fire' },
      },
    ]);

    await expect(
      userService.getHistory(authenticatedUser, { page: 2, limit: 20 }),
    ).resolves.toEqual({
      results: [{ word: 'fire', added: '2026-07-12T08:00:00.000Z' }],
      totalDocs: 45,
      page: 2,
      totalPages: 3,
      hasNext: true,
      hasPrev: true,
    });

    expect(transactionClient.wordHistory.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 20,
        take: 20,
      }),
    );
  });

  it('should isolate history by authenticated user', async () => {
    transactionClient.wordHistory.count.mockResolvedValue(1);
    transactionClient.wordHistory.findMany.mockResolvedValue([]);

    await userService.getHistory(authenticatedUser, { page: 1, limit: 20 });

    expect(transactionClient.wordHistory.count).toHaveBeenCalledWith({
      where: {
        userId: 'user-id',
      },
    });
    expect(transactionClient.wordHistory.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId: 'user-id',
        },
      }),
    );
  });
});
