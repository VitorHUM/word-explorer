import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { configureApplication } from './../src/app/configure-application';
import { CacheService } from './../src/infrastructure/cache/cache.service';
import { PrismaService } from './../src/infrastructure/database/prisma/prisma.service';
import { FreeDictionaryClient } from './../src/infrastructure/dictionary/free-dictionary.client';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  const dictionaryCacheState = new Set<string>();
  const entriesCacheState = new Map<string, Record<string, unknown>>();

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(CacheService)
      .useValue({
        get: jest.fn((key: string) => {
          const cachedValue = entriesCacheState.get(key);

          return Promise.resolve(
            cachedValue
              ? { status: 'HIT' as const, data: cachedValue }
              : { status: 'MISS' as const, data: null },
          );
        }),
        getJson: jest.fn((key: string) =>
          Promise.resolve(entriesCacheState.get(key) ?? null),
        ),
        set: jest.fn((key: string, value: Record<string, unknown>) => {
          entriesCacheState.set(key, value);
          return Promise.resolve();
        }),
        setJson: jest.fn((key: string, value: Record<string, unknown>) => {
          entriesCacheState.set(key, value);
          return Promise.resolve();
        }),
        delete: jest.fn((key: string) => {
          entriesCacheState.delete(key);
          return Promise.resolve();
        }),
        deleteByPattern: jest.fn((pattern: string) => {
          const prefix = pattern.replace('*', '');
          let deletedCount = 0;

          for (const key of Array.from(entriesCacheState.keys())) {
            if (key.startsWith(prefix)) {
              entriesCacheState.delete(key);
              deletedCount += 1;
            }
          }

          return Promise.resolve({ deletedCount, failed: false });
        }),
      })
      .overrideProvider(FreeDictionaryClient)
      .useValue({
        getEnglishEntryWithCache: jest.fn((word: string) =>
          Promise.resolve(
            dictionaryCacheState.has(word)
              ? {
                  entry: {
                    word,
                    phonetics: [{ text: '/faɪə/' }],
                    meanings: [],
                    sourceUrls: ['https://source.example/fire'],
                  },
                  cacheStatus: 'HIT' as const,
                }
              : (() => {
                  dictionaryCacheState.add(word);

                  return {
                    entry: {
                      word,
                      phonetics: [{ text: '/faɪə/' }],
                      meanings: [],
                      sourceUrls: ['https://source.example/fire'],
                    },
                    cacheStatus: 'MISS' as const,
                  };
                })(),
          ),
        ),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    prismaService = app.get(PrismaService);
    configureApplication(app);
    await app.init();
  });

  it('/ (GET)', () => {
    const httpServer = app.getHttpServer() as Parameters<typeof request>[0];

    return request(httpServer)
      .get('/')
      .expect(200)
      .expect(({ body, headers }) => {
        expect(body).toEqual({ message: 'English Dictionary' });
        expect(headers['x-response-time']).toEqual(
          expect.stringMatching(/^\d+$/),
        );
        expect(Number(headers['x-response-time'])).toBeGreaterThanOrEqual(0);
      });
  });

  it('/auth/signup (POST)', async () => {
    const httpServer = app.getHttpServer() as Parameters<typeof request>[0];
    const email = `signup-${Date.now()}@email.com`;

    const response = await request(httpServer).post('/auth/signup').send({
      name: 'User 1',
      email,
      password: 'test',
    });
    const responseBodyUnknown: unknown = response.body;

    if (
      typeof responseBodyUnknown !== 'object' ||
      responseBodyUnknown === null
    ) {
      throw new Error('Expected the signup response body to be an object.');
    }

    const responseBody = responseBodyUnknown as Record<string, unknown>;

    expect(response.status).toBe(201);
    expect(typeof responseBody.id).toBe('string');
    expect(responseBody.name).toBe('User 1');
    expect(responseBody.token).toEqual(expect.stringMatching(/^Bearer\s.+/));
    expect(response.headers['x-response-time']).toEqual(
      expect.stringMatching(/^\d+$/),
    );
    expect(Number(response.headers['x-response-time'])).toBeGreaterThanOrEqual(
      0,
    );
    expect(responseBody).not.toHaveProperty('passwordHash');

    await prismaService.user.deleteMany({
      where: { email },
    });
  });

  it('/auth/signin (POST)', async () => {
    const httpServer = app.getHttpServer() as Parameters<typeof request>[0];
    const email = `signin-${Date.now()}@email.com`;

    await request(httpServer).post('/auth/signup').send({
      name: 'User 1',
      email,
      password: 'test',
    });

    const response = await request(httpServer)
      .post('/auth/signin')
      .send({
        email: `  ${email.toUpperCase()}  `,
        password: 'test',
      });
    const responseBodyUnknown: unknown = response.body;

    if (
      typeof responseBodyUnknown !== 'object' ||
      responseBodyUnknown === null
    ) {
      throw new Error('Expected the signin response body to be an object.');
    }

    const responseBody = responseBodyUnknown as Record<string, unknown>;

    expect(response.status).toBe(201);
    expect(typeof responseBody.id).toBe('string');
    expect(responseBody.name).toBe('User 1');
    expect(responseBody.token).toEqual(expect.stringMatching(/^Bearer\s.+/));
    expect(responseBody).not.toHaveProperty('passwordHash');

    await prismaService.user.deleteMany({
      where: { email },
    });
  });

  it('/user/me (GET) should return the authenticated user profile', async () => {
    const httpServer = app.getHttpServer() as Parameters<typeof request>[0];
    const email = `me-${Date.now()}@email.com`;

    const signUpResponse = await request(httpServer).post('/auth/signup').send({
      name: 'User 1',
      email,
      password: 'test',
    });
    const signUpResponseBodyUnknown: unknown = signUpResponse.body;

    if (
      typeof signUpResponseBodyUnknown !== 'object' ||
      signUpResponseBodyUnknown === null
    ) {
      throw new Error('Expected the signup response body to be an object.');
    }

    const signUpResponseBody = signUpResponseBodyUnknown as Record<
      string,
      unknown
    >;
    const token = signUpResponseBody.token;

    expect(typeof token).toBe('string');

    const response = await request(httpServer)
      .get('/user/me')
      .set('Authorization', token as string);
    const responseBodyUnknown: unknown = response.body;

    if (
      typeof responseBodyUnknown !== 'object' ||
      responseBodyUnknown === null
    ) {
      throw new Error('Expected the profile response body to be an object.');
    }

    const responseBody = responseBodyUnknown as Record<string, unknown>;

    expect(response.status).toBe(200);
    expect(typeof responseBody.id).toBe('string');
    expect(responseBody.name).toBe('User 1');
    expect(responseBody.email).toBe(email);
    expect(typeof responseBody.createdAt).toBe('string');
    expect(typeof responseBody.updatedAt).toBe('string');
    expect(responseBody).not.toHaveProperty('passwordHash');

    await prismaService.user.deleteMany({
      where: { email },
    });
  });

  it('/user/me (GET) should reject requests without a token', async () => {
    const httpServer = app.getHttpServer() as Parameters<typeof request>[0];

    const response = await request(httpServer).get('/user/me');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      message: 'O token de autorização é obrigatório.',
      error: 'Unauthorized',
      statusCode: 401,
    });
  });

  it('/user/me (GET) should reject an invalid token', async () => {
    const httpServer = app.getHttpServer() as Parameters<typeof request>[0];

    const response = await request(httpServer)
      .get('/user/me')
      .set('Authorization', 'Bearer invalid-token');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      message: 'O token informado é inválido.',
      error: 'Unauthorized',
      statusCode: 401,
    });
  });

  it('/user/me/history (GET) should return only the authenticated user history', async () => {
    const httpServer = app.getHttpServer() as Parameters<typeof request>[0];
    const emailA = `history-a-${Date.now()}@email.com`;
    const emailB = `history-b-${Date.now()}@email.com`;
    const wordA = `historyworda${Date.now()}`;
    const wordB = `historywordb${Date.now()}`;

    await prismaService.dictionaryWord.createMany({
      data: [{ value: wordA }, { value: wordB }],
      skipDuplicates: true,
    });

    const signUpResponseA = await request(httpServer)
      .post('/auth/signup')
      .send({
        name: 'User A',
        email: emailA,
        password: 'test',
      });
    await request(httpServer).post('/auth/signup').send({
      name: 'User B',
      email: emailB,
      password: 'test',
    });

    const signUpBodyA = signUpResponseA.body as Record<string, unknown>;
    const tokenA = signUpBodyA.token;

    if (typeof tokenA !== 'string') {
      throw new Error('Expected user A token to be a string.');
    }

    const userA = await prismaService.user.findUnique({
      where: { email: emailA },
      select: { id: true },
    });
    const userB = await prismaService.user.findUnique({
      where: { email: emailB },
      select: { id: true },
    });
    const dictionaryWordA = await prismaService.dictionaryWord.findUnique({
      where: { value: wordA },
      select: { id: true },
    });
    const dictionaryWordB = await prismaService.dictionaryWord.findUnique({
      where: { value: wordB },
      select: { id: true },
    });

    if (!userA || !userB || !dictionaryWordA || !dictionaryWordB) {
      throw new Error('Expected users and words to be persisted.');
    }

    await prismaService.wordHistory.createMany({
      data: [
        {
          userId: userA.id,
          wordId: dictionaryWordA.id,
          viewedAt: new Date('2026-07-12T10:00:00.000Z'),
        },
        {
          userId: userA.id,
          wordId: dictionaryWordA.id,
          viewedAt: new Date('2026-07-12T09:00:00.000Z'),
        },
        {
          userId: userB.id,
          wordId: dictionaryWordB.id,
          viewedAt: new Date('2026-07-12T11:00:00.000Z'),
        },
      ],
    });

    const response = await request(httpServer)
      .get('/user/me/history?page=1&limit=20')
      .set('Authorization', tokenA);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      results: [
        { word: wordA, added: '2026-07-12T10:00:00.000Z' },
        { word: wordA, added: '2026-07-12T09:00:00.000Z' },
      ],
      totalDocs: 2,
      page: 1,
      totalPages: 1,
      hasNext: false,
      hasPrev: false,
    });

    await prismaService.wordHistory.deleteMany({
      where: {
        userId: { in: [userA.id, userB.id] },
      },
    });
    await prismaService.user.deleteMany({
      where: { email: { in: [emailA, emailB] } },
    });
    await prismaService.dictionaryWord.deleteMany({
      where: { value: { in: [wordA, wordB] } },
    });
  });

  it('/user/me/favorites (GET) should return only the authenticated user favorites', async () => {
    const httpServer = app.getHttpServer() as Parameters<typeof request>[0];
    const emailA = `favorites-a-${Date.now()}@email.com`;
    const emailB = `favorites-b-${Date.now()}@email.com`;
    const wordA = `favoriteworda${Date.now()}`;
    const wordB = `favoritewordb${Date.now()}`;

    await prismaService.dictionaryWord.createMany({
      data: [{ value: wordA }, { value: wordB }],
      skipDuplicates: true,
    });

    const signUpResponseA = await request(httpServer)
      .post('/auth/signup')
      .send({
        name: 'User A',
        email: emailA,
        password: 'test',
      });
    await request(httpServer).post('/auth/signup').send({
      name: 'User B',
      email: emailB,
      password: 'test',
    });

    const tokenA = (signUpResponseA.body as Record<string, unknown>).token;

    if (typeof tokenA !== 'string') {
      throw new Error('Expected user A token to be a string.');
    }

    const userA = await prismaService.user.findUnique({
      where: { email: emailA },
      select: { id: true },
    });
    const userB = await prismaService.user.findUnique({
      where: { email: emailB },
      select: { id: true },
    });
    const dictionaryWordA = await prismaService.dictionaryWord.findUnique({
      where: { value: wordA },
      select: { id: true },
    });
    const dictionaryWordB = await prismaService.dictionaryWord.findUnique({
      where: { value: wordB },
      select: { id: true },
    });

    if (!userA || !userB || !dictionaryWordA || !dictionaryWordB) {
      throw new Error('Expected users and words to be persisted.');
    }

    await prismaService.favoriteWord.createMany({
      data: [
        {
          userId: userA.id,
          wordId: dictionaryWordA.id,
          createdAt: new Date('2026-07-12T10:00:00.000Z'),
        },
        {
          userId: userB.id,
          wordId: dictionaryWordB.id,
          createdAt: new Date('2026-07-12T11:00:00.000Z'),
        },
      ],
    });

    const response = await request(httpServer)
      .get('/user/me/favorites?page=1&limit=20')
      .set('Authorization', tokenA);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      results: [{ word: wordA, added: '2026-07-12T10:00:00.000Z' }],
      totalDocs: 1,
      page: 1,
      totalPages: 1,
      hasNext: false,
      hasPrev: false,
    });

    await prismaService.favoriteWord.deleteMany({
      where: {
        userId: { in: [userA.id, userB.id] },
      },
    });
    await prismaService.user.deleteMany({
      where: { email: { in: [emailA, emailB] } },
    });
    await prismaService.dictionaryWord.deleteMany({
      where: { value: { in: [wordA, wordB] } },
    });
  });

  it('/entries/en (GET) should return authenticated paginated search results', async () => {
    const httpServer = app.getHttpServer() as Parameters<typeof request>[0];
    const email = `entries-${Date.now()}@email.com`;
    const wordPrefix = `entryapitest${Date.now()}`;
    const values = [`${wordPrefix}a`, `${wordPrefix}b`, `${wordPrefix}c`];

    const signUpResponse = await request(httpServer).post('/auth/signup').send({
      name: 'User 1',
      email,
      password: 'test',
    });
    const signUpResponseBodyUnknown: unknown = signUpResponse.body;

    if (
      typeof signUpResponseBodyUnknown !== 'object' ||
      signUpResponseBodyUnknown === null
    ) {
      throw new Error('Expected the signup response body to be an object.');
    }

    const signUpResponseBody = signUpResponseBodyUnknown as Record<
      string,
      unknown
    >;
    const token = signUpResponseBody.token;

    if (typeof token !== 'string') {
      throw new Error('Expected the signup token to be a string.');
    }

    await prismaService.dictionaryWord.createMany({
      data: values.map((value) => ({ value })),
      skipDuplicates: true,
    });

    const response = await request(httpServer)
      .get(`/entries/en?search=${wordPrefix}&page=1&limit=2`)
      .set('Authorization', token);
    const responseBodyUnknown: unknown = response.body;

    if (
      typeof responseBodyUnknown !== 'object' ||
      responseBodyUnknown === null
    ) {
      throw new Error('Expected the entries response body to be an object.');
    }

    const responseBody = responseBodyUnknown as Record<string, unknown>;

    expect(response.status).toBe(200);
    expect(response.headers['x-cache']).toBe('MISS');
    expect(response.headers['x-response-time']).toEqual(
      expect.stringMatching(/^\d+$/),
    );
    expect(Number(response.headers['x-response-time'])).toBeGreaterThanOrEqual(
      0,
    );
    expect(responseBody).toEqual({
      results: [`${wordPrefix}a`, `${wordPrefix}b`],
      totalDocs: 3,
      page: 1,
      totalPages: 2,
      hasNext: true,
      hasPrev: false,
    });

    await prismaService.dictionaryWord.deleteMany({
      where: {
        value: {
          in: values,
        },
      },
    });
    await prismaService.user.deleteMany({
      where: { email },
    });
  });

  it('/entries/en (GET) should return HIT on an identical repeated query', async () => {
    const httpServer = app.getHttpServer() as Parameters<typeof request>[0];
    const email = `entries-hit-${Date.now()}@email.com`;
    const wordPrefix = `entriescache${Date.now()}`;
    const values = [`${wordPrefix}a`, `${wordPrefix}b`];

    entriesCacheState.clear();

    const signUpResponse = await request(httpServer).post('/auth/signup').send({
      name: 'User 1',
      email,
      password: 'test',
    });
    const signUpResponseBodyUnknown: unknown = signUpResponse.body;

    if (
      typeof signUpResponseBodyUnknown !== 'object' ||
      signUpResponseBodyUnknown === null
    ) {
      throw new Error('Expected the signup response body to be an object.');
    }

    const signUpResponseBody = signUpResponseBodyUnknown as Record<
      string,
      unknown
    >;
    const token = signUpResponseBody.token;

    if (typeof token !== 'string') {
      throw new Error('Expected the signup token to be a string.');
    }

    await prismaService.dictionaryWord.createMany({
      data: values.map((value) => ({ value })),
      skipDuplicates: true,
    });

    const firstResponse = await request(httpServer)
      .get(`/entries/en?search=${wordPrefix}&page=1&limit=20`)
      .set('Authorization', token);
    const secondResponse = await request(httpServer)
      .get(`/entries/en?search=${wordPrefix}&page=1&limit=20`)
      .set('Authorization', token);

    expect(firstResponse.status).toBe(200);
    expect(firstResponse.headers['x-cache']).toBe('MISS');
    expect(secondResponse.status).toBe(200);
    expect(secondResponse.headers['x-cache']).toBe('HIT');

    await prismaService.dictionaryWord.deleteMany({
      where: {
        value: {
          in: values,
        },
      },
    });
    await prismaService.user.deleteMany({
      where: { email },
    });
  });

  it('/entries/en (GET) should reject invalid query parameters', async () => {
    const httpServer = app.getHttpServer() as Parameters<typeof request>[0];
    const email = `entries-invalid-${Date.now()}@email.com`;

    const signUpResponse = await request(httpServer).post('/auth/signup').send({
      name: 'User 1',
      email,
      password: 'test',
    });
    const signUpResponseBodyUnknown: unknown = signUpResponse.body;

    if (
      typeof signUpResponseBodyUnknown !== 'object' ||
      signUpResponseBodyUnknown === null
    ) {
      throw new Error('Expected the signup response body to be an object.');
    }

    const signUpResponseBody = signUpResponseBodyUnknown as Record<
      string,
      unknown
    >;
    const token = signUpResponseBody.token;

    if (typeof token !== 'string') {
      throw new Error('Expected the signup token to be a string.');
    }

    const response = await request(httpServer)
      .get('/entries/en?page=0&limit=101')
      .set('Authorization', token);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      message:
        'page deve ser maior ou igual a 1.; limit deve ser menor ou igual a 100.',
      error: 'Bad Request',
      statusCode: 400,
    });

    await prismaService.user.deleteMany({
      where: { email },
    });
  });

  it('/entries/en/:word (GET) should return details and persist history', async () => {
    const httpServer = app.getHttpServer() as Parameters<typeof request>[0];
    const email = `entry-details-${Date.now()}@email.com`;
    const word = 'fire';

    await prismaService.dictionaryWord.upsert({
      where: { value: word },
      update: {},
      create: { value: word },
    });

    const signUpResponse = await request(httpServer).post('/auth/signup').send({
      name: 'User 1',
      email,
      password: 'test',
    });
    const signUpResponseBodyUnknown: unknown = signUpResponse.body;

    if (
      typeof signUpResponseBodyUnknown !== 'object' ||
      signUpResponseBodyUnknown === null
    ) {
      throw new Error('Expected the signup response body to be an object.');
    }

    const signUpResponseBody = signUpResponseBodyUnknown as Record<
      string,
      unknown
    >;
    const token = signUpResponseBody.token;

    if (typeof token !== 'string') {
      throw new Error('Expected the signup token to be a string.');
    }

    const response = await request(httpServer)
      .get(`/entries/en/${word}`)
      .set('Authorization', token);
    const responseBodyUnknown: unknown = response.body;

    if (
      typeof responseBodyUnknown !== 'object' ||
      responseBodyUnknown === null
    ) {
      throw new Error(
        'Expected the entry details response body to be an object.',
      );
    }

    const responseBody = responseBodyUnknown as Record<string, unknown>;

    expect(response.status).toBe(200);
    expect(response.headers['x-cache']).toBe('MISS');
    expect(response.headers['x-response-time']).toEqual(
      expect.stringMatching(/^\d+$/),
    );
    expect(Number(response.headers['x-response-time'])).toBeGreaterThanOrEqual(
      0,
    );
    expect(responseBody.word).toBe(word);
    expect(Array.isArray(responseBody.phonetics)).toBe(true);
    expect(Array.isArray(responseBody.meanings)).toBe(true);
    expect(Array.isArray(responseBody.sourceUrls)).toBe(true);
    expect(responseBody).not.toHaveProperty('cacheStatus');
    expect(responseBody).not.toHaveProperty('body');

    const persistedUser = await prismaService.user.findUnique({
      where: { email },
      select: { id: true },
    });
    const persistedWord = await prismaService.dictionaryWord.findUnique({
      where: { value: word },
      select: { id: true },
    });

    expect(persistedUser).toBeTruthy();
    expect(persistedWord).toBeTruthy();

    if (!persistedUser || !persistedWord) {
      throw new Error('Expected persisted user and word to exist.');
    }

    const historyCount = await prismaService.wordHistory.count({
      where: {
        userId: persistedUser.id,
        wordId: persistedWord.id,
      },
    });

    expect(historyCount).toBeGreaterThan(0);

    await prismaService.wordHistory.deleteMany({
      where: {
        userId: persistedUser.id,
      },
    });
    await prismaService.user.deleteMany({
      where: { email },
    });
  });

  it('/entries/en/:word (GET) should return HIT on a repeated successful lookup', async () => {
    const httpServer = app.getHttpServer() as Parameters<typeof request>[0];
    const email = `entry-details-hit-${Date.now()}@email.com`;
    const word = `cacheword${Date.now()}`;

    dictionaryCacheState.clear();

    await prismaService.dictionaryWord.upsert({
      where: { value: word },
      update: {},
      create: { value: word },
    });

    const signUpResponse = await request(httpServer).post('/auth/signup').send({
      name: 'User 1',
      email,
      password: 'test',
    });
    const signUpResponseBodyUnknown: unknown = signUpResponse.body;

    if (
      typeof signUpResponseBodyUnknown !== 'object' ||
      signUpResponseBodyUnknown === null
    ) {
      throw new Error('Expected the signup response body to be an object.');
    }

    const signUpResponseBody = signUpResponseBodyUnknown as Record<
      string,
      unknown
    >;
    const token = signUpResponseBody.token;

    if (typeof token !== 'string') {
      throw new Error('Expected the signup token to be a string.');
    }

    const firstResponse = await request(httpServer)
      .get(`/entries/en/${word}`)
      .set('Authorization', token);
    const secondResponse = await request(httpServer)
      .get(`/entries/en/${word}`)
      .set('Authorization', token);

    expect(firstResponse.status).toBe(200);
    expect(firstResponse.headers['x-cache']).toBe('MISS');
    expect(firstResponse.headers['x-response-time']).toEqual(
      expect.stringMatching(/^\d+$/),
    );
    expect(
      Number(firstResponse.headers['x-response-time']),
    ).toBeGreaterThanOrEqual(0);

    expect(secondResponse.status).toBe(200);
    expect(secondResponse.headers['x-cache']).toBe('HIT');
    expect(secondResponse.headers['x-response-time']).toEqual(
      expect.stringMatching(/^\d+$/),
    );
    expect(
      Number(secondResponse.headers['x-response-time']),
    ).toBeGreaterThanOrEqual(0);

    const persistedUser = await prismaService.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (!persistedUser) {
      throw new Error('Expected persisted user to exist.');
    }

    await prismaService.wordHistory.deleteMany({
      where: {
        userId: persistedUser.id,
      },
    });
    await prismaService.user.deleteMany({
      where: { email },
    });
  });

  it('/entries/en/:word/favorite (POST) should favorite idempotently and /unfavorite (DELETE) should return 204', async () => {
    const httpServer = app.getHttpServer() as Parameters<typeof request>[0];
    const email = `favorite-${Date.now()}@email.com`;
    const word = `favoriteword${Date.now()}`;

    await prismaService.dictionaryWord.upsert({
      where: { value: word },
      update: {},
      create: { value: word },
    });

    const signUpResponse = await request(httpServer).post('/auth/signup').send({
      name: 'User 1',
      email,
      password: 'test',
    });
    const signUpResponseBodyUnknown: unknown = signUpResponse.body;

    if (
      typeof signUpResponseBodyUnknown !== 'object' ||
      signUpResponseBodyUnknown === null
    ) {
      throw new Error('Expected the signup response body to be an object.');
    }

    const signUpResponseBody = signUpResponseBodyUnknown as Record<
      string,
      unknown
    >;
    const token = signUpResponseBody.token;

    if (typeof token !== 'string') {
      throw new Error('Expected the signup token to be a string.');
    }

    const favoriteResponse = await request(httpServer)
      .post(`/entries/en/${word}/favorite`)
      .set('Authorization', token);
    const favoriteAgainResponse = await request(httpServer)
      .post(`/entries/en/${word}/favorite`)
      .set('Authorization', token);

    expect(favoriteResponse.status).toBe(204);
    expect(favoriteAgainResponse.status).toBe(204);

    const persistedUser = await prismaService.user.findUnique({
      where: { email },
      select: { id: true },
    });
    const persistedWord = await prismaService.dictionaryWord.findUnique({
      where: { value: word },
      select: { id: true },
    });

    if (!persistedUser || !persistedWord) {
      throw new Error('Expected persisted user and word to exist.');
    }

    const favoritesCount = await prismaService.favoriteWord.count({
      where: {
        userId: persistedUser.id,
        wordId: persistedWord.id,
      },
    });

    expect(favoritesCount).toBe(1);

    const unfavoriteResponse = await request(httpServer)
      .delete(`/entries/en/${word}/unfavorite`)
      .set('Authorization', token);
    const unfavoriteAgainResponse = await request(httpServer)
      .delete(`/entries/en/${word}/unfavorite`)
      .set('Authorization', token);

    expect(unfavoriteResponse.status).toBe(204);
    expect(unfavoriteResponse.text).toBe('');
    expect(unfavoriteAgainResponse.status).toBe(204);

    const favoritesCountAfterDelete = await prismaService.favoriteWord.count({
      where: {
        userId: persistedUser.id,
        wordId: persistedWord.id,
      },
    });

    expect(favoritesCountAfterDelete).toBe(0);

    await prismaService.user.deleteMany({ where: { email } });
    await prismaService.dictionaryWord.deleteMany({ where: { value: word } });
  });

  it('/entries/en/:word/favorite (POST) should isolate favorites between users', async () => {
    const httpServer = app.getHttpServer() as Parameters<typeof request>[0];
    const emailA = `favorite-a-${Date.now()}@email.com`;
    const emailB = `favorite-b-${Date.now()}@email.com`;
    const word = `favoriteisolation${Date.now()}`;

    await prismaService.dictionaryWord.upsert({
      where: { value: word },
      update: {},
      create: { value: word },
    });

    const signUpResponseA = await request(httpServer)
      .post('/auth/signup')
      .send({
        name: 'User A',
        email: emailA,
        password: 'test',
      });
    const signUpResponseB = await request(httpServer)
      .post('/auth/signup')
      .send({
        name: 'User B',
        email: emailB,
        password: 'test',
      });

    const tokenA = (signUpResponseA.body as Record<string, unknown>).token;
    const tokenB = (signUpResponseB.body as Record<string, unknown>).token;

    if (typeof tokenA !== 'string' || typeof tokenB !== 'string') {
      throw new Error('Expected both signup tokens to be strings.');
    }

    await request(httpServer)
      .post(`/entries/en/${word}/favorite`)
      .set('Authorization', tokenA);
    await request(httpServer)
      .post(`/entries/en/${word}/favorite`)
      .set('Authorization', tokenB);
    await request(httpServer)
      .delete(`/entries/en/${word}/unfavorite`)
      .set('Authorization', tokenA);

    const userB = await prismaService.user.findUnique({
      where: { email: emailB },
      select: { id: true },
    });
    const persistedWord = await prismaService.dictionaryWord.findUnique({
      where: { value: word },
      select: { id: true },
    });

    if (!userB || !persistedWord) {
      throw new Error('Expected user B and word to exist.');
    }

    const userBFavoritesCount = await prismaService.favoriteWord.count({
      where: {
        userId: userB.id,
        wordId: persistedWord.id,
      },
    });

    expect(userBFavoritesCount).toBe(1);

    await prismaService.favoriteWord.deleteMany({
      where: { wordId: persistedWord.id },
    });
    await prismaService.user.deleteMany({
      where: { email: { in: [emailA, emailB] } },
    });
    await prismaService.dictionaryWord.deleteMany({ where: { value: word } });
  });

  it('/entries/en/:word/favorite (POST) should return 404 for nonexistent local word', async () => {
    const httpServer = app.getHttpServer() as Parameters<typeof request>[0];
    const email = `favorite-missing-${Date.now()}@email.com`;

    const signUpResponse = await request(httpServer).post('/auth/signup').send({
      name: 'User 1',
      email,
      password: 'test',
    });
    const token = (signUpResponse.body as Record<string, unknown>).token;

    if (typeof token !== 'string') {
      throw new Error('Expected signup token to be a string.');
    }

    const response = await request(httpServer)
      .post('/entries/en/not-in-local-base/favorite')
      .set('Authorization', token);

    expect(response.status).toBe(404);

    await prismaService.user.deleteMany({ where: { email } });
  });

  afterAll(async () => {
    await app.close();
  });
});
