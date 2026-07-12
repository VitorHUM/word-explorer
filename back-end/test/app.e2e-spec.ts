import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { configureApplication } from './../src/app/configure-application';
import { PrismaService } from './../src/infrastructure/database/prisma/prisma.service';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

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
      .expect({ message: 'English Dictionary' });
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

  afterAll(async () => {
    await app.close();
  });
});
