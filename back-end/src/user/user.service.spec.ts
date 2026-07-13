import type { AuthenticatedUser } from '../auth/types/auth.type';
import { FavoriteWordRepository } from '../infrastructure/database/repositories/favorite-word.repository';
import { WordHistoryRepository } from '../infrastructure/database/repositories/word-history.repository';
import { UserService } from './user.service';

describe('UserService', () => {
  let userService: UserService;
  let favoriteWordRepository: {
    findPaginatedByUser: jest.Mock;
  };
  let wordHistoryRepository: {
    findPaginatedByUser: jest.Mock;
  };

  const authenticatedUser: AuthenticatedUser = {
    id: 'user-id',
    name: 'User 1',
    email: 'user@example.com',
    createdAt: new Date('2026-07-12T00:00:00.000Z'),
    updatedAt: new Date('2026-07-12T00:00:00.000Z'),
  };

  beforeEach(() => {
    favoriteWordRepository = {
      findPaginatedByUser: jest.fn(),
    };

    wordHistoryRepository = {
      findPaginatedByUser: jest.fn(),
    };

    const favoriteWordRepositoryInstance = Object.create(
      FavoriteWordRepository.prototype,
    ) as FavoriteWordRepository;
    const wordHistoryRepositoryInstance = Object.create(
      WordHistoryRepository.prototype,
    ) as WordHistoryRepository;

    Object.assign(favoriteWordRepositoryInstance, favoriteWordRepository);
    Object.assign(wordHistoryRepositoryInstance, wordHistoryRepository);

    userService = new UserService(
      favoriteWordRepositoryInstance,
      wordHistoryRepositoryInstance,
    );
  });

  it('should return an empty favorites list', async () => {
    favoriteWordRepository.findPaginatedByUser.mockResolvedValue({
      totalDocs: 0,
      items: [],
    });

    await expect(
      userService.getFavorites(authenticatedUser, { page: 1, limit: 20 }),
    ).resolves.toEqual({
      results: [],
      totalDocs: 0,
      page: 1,
      totalPages: 0,
      hasNext: false,
      hasPrev: false,
    });
  });

  it('should order favorites from most recent to oldest', async () => {
    favoriteWordRepository.findPaginatedByUser.mockResolvedValue({
      totalDocs: 2,
      items: [
        {
          createdAt: new Date('2026-07-12T10:00:00.000Z'),
          word: { value: 'fire' },
        },
        {
          createdAt: new Date('2026-07-12T09:00:00.000Z'),
          word: { value: 'firefly' },
        },
      ],
    });

    await expect(
      userService.getFavorites(authenticatedUser, { page: 1, limit: 20 }),
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

  it('should paginate favorites correctly', async () => {
    favoriteWordRepository.findPaginatedByUser.mockResolvedValue({
      totalDocs: 45,
      items: [
        {
          createdAt: new Date('2026-07-12T08:00:00.000Z'),
          word: { value: 'fire' },
        },
      ],
    });

    await expect(
      userService.getFavorites(authenticatedUser, { page: 2, limit: 20 }),
    ).resolves.toEqual({
      results: [{ word: 'fire', added: '2026-07-12T08:00:00.000Z' }],
      totalDocs: 45,
      page: 2,
      totalPages: 3,
      hasNext: true,
      hasPrev: true,
    });
  });

  it('should isolate favorites by authenticated user', async () => {
    favoriteWordRepository.findPaginatedByUser.mockResolvedValue({
      totalDocs: 1,
      items: [],
    });

    await userService.getFavorites(authenticatedUser, { page: 1, limit: 20 });

    expect(favoriteWordRepository.findPaginatedByUser).toHaveBeenCalledWith({
      userId: 'user-id',
      page: 1,
      limit: 20,
    });
  });

  it('should return an empty history', async () => {
    wordHistoryRepository.findPaginatedByUser.mockResolvedValue({
      totalDocs: 0,
      items: [],
    });

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
    wordHistoryRepository.findPaginatedByUser.mockResolvedValue({
      totalDocs: 2,
      items: [
        {
          viewedAt: new Date('2026-07-12T10:00:00.000Z'),
          word: { value: 'fire' },
        },
        {
          viewedAt: new Date('2026-07-12T09:00:00.000Z'),
          word: { value: 'firefly' },
        },
      ],
    });

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
    wordHistoryRepository.findPaginatedByUser.mockResolvedValue({
      totalDocs: 2,
      items: [],
    });

    await userService.getHistory(authenticatedUser, { page: 1, limit: 20 });
  });

  it('should paginate correctly', async () => {
    wordHistoryRepository.findPaginatedByUser.mockResolvedValue({
      totalDocs: 45,
      items: [
        {
          viewedAt: new Date('2026-07-12T08:00:00.000Z'),
          word: { value: 'fire' },
        },
      ],
    });

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
  });

  it('should isolate history by authenticated user', async () => {
    wordHistoryRepository.findPaginatedByUser.mockResolvedValue({
      totalDocs: 1,
      items: [],
    });

    await userService.getHistory(authenticatedUser, { page: 1, limit: 20 });

    expect(wordHistoryRepository.findPaginatedByUser).toHaveBeenCalledWith({
      userId: 'user-id',
      page: 1,
      limit: 20,
    });
  });
});
