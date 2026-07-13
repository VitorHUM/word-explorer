import type { INestApplication } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApplication } from '../src/app/configure-application';
import type { CacheDeleteByPatternResult } from '../src/infrastructure/cache/cache.service';
import { CacheService } from '../src/infrastructure/cache/cache.service';
import { PrismaService } from '../src/infrastructure/database/prisma/prisma.service';
import { FreeDictionaryClient } from '../src/infrastructure/dictionary/free-dictionary.client';

type HttpServer = Parameters<typeof request>[0];

interface AuthenticatedTestUser {
  id: string;
  token: string;
  email: string;
}

interface MockDictionaryResponse {
  ok: boolean;
  status: number;
  json(): Promise<unknown>;
}

class TestCacheService {
  private readonly store = new Map<string, unknown>();
  private unavailable = false;

  setUnavailable(unavailable: boolean): void {
    this.unavailable = unavailable;
  }

  clear(): void {
    this.store.clear();
    this.unavailable = false;
  }

  get<T>(key: string): Promise<{ status: 'HIT' | 'MISS'; data: T | null }> {
    if (this.unavailable) {
      return Promise.resolve({ status: 'MISS', data: null });
    }

    if (!this.store.has(key)) {
      return Promise.resolve({ status: 'MISS', data: null });
    }

    return Promise.resolve({ status: 'HIT', data: this.store.get(key) as T });
  }

  async getJson<T>(key: string): Promise<T | null> {
    return (await this.get<T>(key)).data;
  }

  set(key: string, value: unknown): Promise<void> {
    if (!this.unavailable) {
      this.store.set(key, value);
    }

    return Promise.resolve();
  }

  async setJson(key: string, value: unknown): Promise<void> {
    await this.set(key, value);
  }

  delete(key: string): Promise<void> {
    this.store.delete(key);

    return Promise.resolve();
  }

  deleteByPattern(pattern: string): Promise<CacheDeleteByPatternResult> {
    const prefix = pattern.replace(/\*$/, '');
    let deletedCount = 0;

    for (const key of Array.from(this.store.keys())) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
        deletedCount += 1;
      }
    }

    return Promise.resolve({ deletedCount, failed: false });
  }
}

describe('Back-end requirements (e2e)', () => {
  let app: INestApplication;
  let httpServer: HttpServer;
  let prismaService: PrismaService;
  let cacheService: TestCacheService;
  let dictionaryFetchMock: jest.Mock<Promise<MockDictionaryResponse>, [string]>;

  beforeAll(async () => {
    cacheService = new TestCacheService();
    dictionaryFetchMock = jest.fn((url: string) =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve(buildDictionaryPayload(url)),
      }),
    );

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(CacheService)
      .useValue(cacheService)
      .compile();

    app = moduleFixture.createNestApplication();
    prismaService = app.get(PrismaService);
    app
      .get(FreeDictionaryClient)
      .setFetchImplementation(dictionaryFetchMock as never);

    configureApplication(app);
    await app.init();

    httpServer = app.getHttpServer() as HttpServer;
  });

  beforeEach(async () => {
    cacheService.clear();
    dictionaryFetchMock.mockClear();
    await cleanupTestData();
  });

  afterEach(async () => {
    await cleanupTestData();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET / retorna a identificação da API sem cache', async () => {
    const response = await request(httpServer).get('/');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: 'English Dictionary' });
    expectResponseTime(response.headers);
    expect(response.headers['x-cache']).toBeUndefined();
  });

  it('cadastra, autentica e retorna o perfil do usuário autenticado', async () => {
    const email = testEmail('auth');

    const signUpResponse = await request(httpServer).post('/auth/signup').send({
      name: 'User E2E',
      email,
      password: 'test',
    });
    const signUpBody = getResponseBody(signUpResponse);

    expect(signUpResponse.status).toBe(201);
    expect(signUpBody).toEqual({
      id: anyString(),
      name: 'User E2E',
      token: matchingString(/^Bearer\s.+/),
    });
    expect(signUpBody).not.toHaveProperty('passwordHash');
    expectResponseTime(signUpResponse.headers);
    expect(signUpResponse.headers['x-cache']).toBeUndefined();

    const signInResponse = await request(httpServer)
      .post('/auth/signin')
      .send({
        email: `  ${email.toUpperCase()}  `,
        password: 'test',
      });
    const signInBody = getResponseBody(signInResponse);

    expect(signInResponse.status).toBe(201);
    expect(signInBody).toEqual({
      id: signUpBody.id,
      name: 'User E2E',
      token: matchingString(/^Bearer\s.+/),
    });
    expectResponseTime(signInResponse.headers);
    expect(signInResponse.headers['x-cache']).toBeUndefined();

    const profileResponse = await request(httpServer)
      .get('/user/me')
      .set('Authorization', String(signInBody.token));
    const profileBody = getResponseBody(profileResponse);

    expect(profileResponse.status).toBe(200);
    expect(profileBody).toEqual({
      id: signUpBody.id,
      name: 'User E2E',
      email,
      createdAt: anyString(),
      updatedAt: anyString(),
    });
    expect(profileBody).not.toHaveProperty('passwordHash');
    expectResponseTime(profileResponse.headers);
    expect(profileResponse.headers['x-cache']).toBeUndefined();
  });

  it('bloqueia acesso protegido sem token', async () => {
    const response = await request(httpServer).get('/user/me');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      message: 'O token de autorização é obrigatório.',
      error: 'Unauthorized',
      statusCode: 401,
    });
    expectResponseTime(response.headers);
    expect(response.headers['x-cache']).toBeUndefined();
  });

  it('lista palavras, busca e reutiliza cache apenas para os mesmos parâmetros', async () => {
    const user = await createUser('entries');
    const prefix = testWord('entries');
    const words = [`${prefix}a`, `${prefix}b`, `${prefix}c`];
    await createDictionaryWords(words);

    const firstResponse = await request(httpServer)
      .get(`/entries/en?search=${prefix}&page=1&limit=2`)
      .set('Authorization', user.token);

    expect(firstResponse.status).toBe(200);
    expect(firstResponse.headers['x-cache']).toBe('MISS');
    expectResponseTime(firstResponse.headers);
    expect(firstResponse.body).toEqual({
      results: [`${prefix}a`, `${prefix}b`],
      totalDocs: 3,
      page: 1,
      totalPages: 2,
      hasNext: true,
      hasPrev: false,
    });

    const repeatedResponse = await request(httpServer)
      .get(`/entries/en?search=${prefix}&page=1&limit=2`)
      .set('Authorization', user.token);

    expect(repeatedResponse.status).toBe(200);
    expect(repeatedResponse.headers['x-cache']).toBe('HIT');
    expectResponseTime(repeatedResponse.headers);
    expect(repeatedResponse.body).toEqual(firstResponse.body);

    const differentParamsResponse = await request(httpServer)
      .get(`/entries/en?search=${prefix}&page=2&limit=2`)
      .set('Authorization', user.token);

    expect(differentParamsResponse.status).toBe(200);
    expect(differentParamsResponse.headers['x-cache']).toBe('MISS');
    expectResponseTime(differentParamsResponse.headers);
    expect(differentParamsResponse.body).toEqual({
      results: [`${prefix}c`],
      totalDocs: 3,
      page: 2,
      totalPages: 2,
      hasNext: false,
      hasPrev: true,
    });
  });

  it('retorna detalhe com MISS, depois HIT, sem nova chamada externa e com novo histórico', async () => {
    const user = await createUser('details');
    const word = testWord('detail');
    await createDictionaryWords([word]);

    const firstResponse = await request(httpServer)
      .get(`/entries/en/${word}`)
      .set('Authorization', user.token);

    expect(firstResponse.status).toBe(200);
    expect(firstResponse.headers['x-cache']).toBe('MISS');
    expectResponseTime(firstResponse.headers);
    expect(firstResponse.body).toEqual(buildEntryBody(word));
    expect(firstResponse.body).not.toHaveProperty('cacheStatus');
    expect(firstResponse.body).not.toHaveProperty('body');
    expect(dictionaryFetchMock).toHaveBeenCalledTimes(1);
    await expectHistoryCount(user.id, word, 1);

    const repeatedResponse = await request(httpServer)
      .get(`/entries/en/${word}`)
      .set('Authorization', user.token);

    expect(repeatedResponse.status).toBe(200);
    expect(repeatedResponse.headers['x-cache']).toBe('HIT');
    expectResponseTime(repeatedResponse.headers);
    expect(repeatedResponse.body).toEqual(firstResponse.body);
    expect(dictionaryFetchMock).toHaveBeenCalledTimes(1);
    await expectHistoryCount(user.id, word, 2);
  });

  it('favorita, lista favoritos e desfavorita uma palavra', async () => {
    const user = await createUser('favorite');
    const word = testWord('favorite');
    await createDictionaryWords([word]);

    const favoriteResponse = await request(httpServer)
      .post(`/entries/en/${word}/favorite`)
      .set('Authorization', user.token);

    expect(favoriteResponse.status).toBe(204);
    expect(favoriteResponse.text).toBe('');
    expectResponseTime(favoriteResponse.headers);
    expect(favoriteResponse.headers['x-cache']).toBeUndefined();

    const favoritesResponse = await request(httpServer)
      .get('/user/me/favorites?page=1&limit=20')
      .set('Authorization', user.token);
    const favoritesBody = getResponseBody(favoritesResponse);

    expect(favoritesResponse.status).toBe(200);
    expect(favoritesBody).toEqual({
      results: [{ word, added: anyString() }],
      totalDocs: 1,
      page: 1,
      totalPages: 1,
      hasNext: false,
      hasPrev: false,
    });
    expectResponseTime(favoritesResponse.headers);
    expect(favoritesResponse.headers['x-cache']).toBeUndefined();

    const unfavoriteResponse = await request(httpServer)
      .delete(`/entries/en/${word}/unfavorite`)
      .set('Authorization', user.token);

    expect(unfavoriteResponse.status).toBe(204);
    expect(unfavoriteResponse.text).toBe('');
    expectResponseTime(unfavoriteResponse.headers);

    const emptyFavoritesResponse = await request(httpServer)
      .get('/user/me/favorites?page=1&limit=20')
      .set('Authorization', user.token);
    const emptyFavoritesBody = getResponseBody(emptyFavoritesResponse);

    expect(emptyFavoritesResponse.status).toBe(200);
    expect(emptyFavoritesBody.results).toEqual([]);
    expect(emptyFavoritesBody.totalDocs).toBe(0);
  });

  it('mantém isolamento de histórico e favoritos entre dois usuários', async () => {
    const userA = await createUser('isolation-a');
    const userB = await createUser('isolation-b');
    const wordA = testWord('isolationa');
    const wordB = testWord('isolationb');
    await createDictionaryWords([wordA, wordB]);

    await request(httpServer)
      .get(`/entries/en/${wordA}`)
      .set('Authorization', userA.token);
    await request(httpServer)
      .get(`/entries/en/${wordB}`)
      .set('Authorization', userB.token);
    await request(httpServer)
      .post(`/entries/en/${wordA}/favorite`)
      .set('Authorization', userA.token);
    await request(httpServer)
      .post(`/entries/en/${wordB}/favorite`)
      .set('Authorization', userB.token);

    const historyAResponse = await request(httpServer)
      .get('/user/me/history?page=1&limit=20')
      .set('Authorization', userA.token);
    const favoritesAResponse = await request(httpServer)
      .get('/user/me/favorites?page=1&limit=20')
      .set('Authorization', userA.token);
    const historyABody = getResponseBody(historyAResponse);
    const favoritesABody = getResponseBody(favoritesAResponse);

    expect(historyAResponse.status).toBe(200);
    expect(historyABody.results).toEqual([{ word: wordA, added: anyString() }]);
    expect(historyABody.results).not.toContainEqual(
      expect.objectContaining({ word: wordB }),
    );

    expect(favoritesAResponse.status).toBe(200);
    expect(favoritesABody.results).toEqual([
      { word: wordA, added: anyString() },
    ]);
    expect(favoritesABody.results).not.toContainEqual(
      expect.objectContaining({ word: wordB }),
    );
  });

  it('usa fallback quando o Redis está indisponível', async () => {
    const user = await createUser('redis-fallback');
    const word = testWord('fallback');
    await createDictionaryWords([word]);
    cacheService.setUnavailable(true);

    const response = await request(httpServer)
      .get(`/entries/en?search=${word}&page=1&limit=20`)
      .set('Authorization', user.token);

    expect(response.status).toBe(200);
    expect(response.headers['x-cache']).toBe('MISS');
    expectResponseTime(response.headers);
    expect(response.body).toEqual({
      results: [word],
      totalDocs: 1,
      page: 1,
      totalPages: 1,
      hasNext: false,
      hasPrev: false,
    });
  });

  async function createUser(label: string): Promise<AuthenticatedTestUser> {
    const email = testEmail(label);
    const response = await request(httpServer)
      .post('/auth/signup')
      .send({
        name: `User ${label}`,
        email,
        password: 'test',
      });
    const body = getResponseBody(response);

    expect(response.status).toBe(201);
    expect(typeof body.id).toBe('string');
    expect(body.token).toEqual(matchingString(/^Bearer\s.+/));

    return {
      id: body.id as string,
      token: body.token as string,
      email,
    };
  }

  async function createDictionaryWords(words: string[]): Promise<void> {
    await prismaService.dictionaryWord.createMany({
      data: words.map((value) => ({ value })),
      skipDuplicates: true,
    });
  }

  async function expectHistoryCount(
    userId: string,
    word: string,
    expectedCount: number,
  ): Promise<void> {
    const dictionaryWord = await prismaService.dictionaryWord.findUnique({
      where: { value: word },
      select: { id: true },
    });

    expect(dictionaryWord).toBeTruthy();

    const historyCount = await prismaService.wordHistory.count({
      where: {
        userId,
        wordId: dictionaryWord?.id,
      },
    });

    expect(historyCount).toBe(expectedCount);
  }

  async function cleanupTestData(): Promise<void> {
    const testUsers = await prismaService.user.findMany({
      where: { email: { endsWith: '@e2e.test' } },
      select: { id: true },
    });
    const testWords = await prismaService.dictionaryWord.findMany({
      where: { value: { startsWith: 'e2e' } },
      select: { id: true },
    });
    const userIds = testUsers.map((user) => user.id);
    const wordIds = testWords.map((word) => word.id);

    await prismaService.wordHistory.deleteMany({
      where: {
        OR: [{ userId: { in: userIds } }, { wordId: { in: wordIds } }],
      },
    });
    await prismaService.favoriteWord.deleteMany({
      where: {
        OR: [{ userId: { in: userIds } }, { wordId: { in: wordIds } }],
      },
    });
    await prismaService.user.deleteMany({
      where: { id: { in: userIds } },
    });
    await prismaService.dictionaryWord.deleteMany({
      where: { id: { in: wordIds } },
    });
  }
});

function testEmail(label: string): string {
  return `${label}-${Date.now()}-${Math.random().toString(36).slice(2)}@e2e.test`;
}

function testWord(label: string): string {
  return `e2e${label}${Date.now()}${Math.random().toString(36).slice(2)}`;
}

function expectResponseTime(headers: Record<string, string | string[]>): void {
  expect(headers['x-response-time']).toEqual(matchingString(/^\d+$/));
  expect(Number(headers['x-response-time'])).toBeGreaterThanOrEqual(0);
}

function anyString(): unknown {
  const value: unknown = expect.any(String);

  return value;
}

function matchingString(pattern: RegExp): unknown {
  const value: unknown = expect.stringMatching(pattern);

  return value;
}

function getResponseBody(response: { body: unknown }): Record<string, unknown> {
  if (typeof response.body !== 'object' || response.body === null) {
    throw new Error('Expected response body to be an object.');
  }

  return response.body as Record<string, unknown>;
}

function buildDictionaryPayload(url: string): unknown[] {
  const word = decodeURIComponent(url.split('/').pop() ?? 'fire');

  return [
    {
      word,
      phonetics: [
        {
          text: '/faɪə/',
          audio:
            'https://api.dictionaryapi.dev/media/pronunciations/en/fire-us.mp3',
        },
      ],
      meanings: [
        {
          partOfSpeech: 'noun',
          definitions: [
            {
              definition: 'Combustion or burning.',
              example: 'The fire was warm.',
              synonyms: ['blaze'],
              antonyms: ['ice'],
            },
          ],
          synonyms: ['flame'],
          antonyms: ['water'],
        },
      ],
      sourceUrls: ['https://en.wiktionary.org/wiki/fire'],
    },
  ];
}

function buildEntryBody(word: string): Record<string, unknown> {
  return {
    word,
    phonetics: [
      {
        text: '/faɪə/',
        audio:
          'https://api.dictionaryapi.dev/media/pronunciations/en/fire-us.mp3',
      },
    ],
    meanings: [
      {
        partOfSpeech: 'noun',
        definitions: [
          {
            definition: 'Combustion or burning.',
            example: 'The fire was warm.',
            synonyms: ['blaze'],
            antonyms: ['ice'],
          },
        ],
        synonyms: ['flame'],
        antonyms: ['water'],
      },
    ],
    sourceUrls: ['https://en.wiktionary.org/wiki/fire'],
  };
}
