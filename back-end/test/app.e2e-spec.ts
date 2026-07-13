import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { configureApplication } from './../src/app/configure-application';
import { PrismaService } from './../src/infrastructure/database/prisma/prisma.service';
import { FreeDictionaryClient } from './../src/infrastructure/dictionary/free-dictionary.client';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  const dictionaryCacheState = new Set<string>();

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
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
    expect(response.headers['x-cache']).toBeUndefined();
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

  afterAll(async () => {
    await app.close();
  });
});
