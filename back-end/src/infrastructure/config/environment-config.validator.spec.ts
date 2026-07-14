import { validateEnvironment } from './environment-config.validator';

describe('validateEnvironment', () => {
  it('should return a typed environment for valid values', () => {
    const environment = validateEnvironment({
      NODE_ENV: 'development',
      PORT: '3001',
      DATABASE_URL:
        'postgresql://word_explorer:word_explorer@localhost:5432/word_explorer?schema=public',
      CORS_ALLOWED_ORIGINS: 'http://localhost:3000,http://localhost:3002',
      REDIS_HOST: '127.0.0.1',
      REDIS_PORT: '6379',
      REDIS_TTL_SECONDS: '3600',
      THROTTLE_TTL_MS: '60000',
      THROTTLE_LIMIT: '300',
      AUTH_THROTTLE_TTL_MS: '60000',
      AUTH_THROTTLE_LIMIT: '30',
      JWT_SECRET: 'super-secret',
      JWT_EXPIRES_IN: '60m',
      DICTIONARY_API_URL: 'https://api.dictionaryapi.dev/api/v2',
      DICTIONARY_CACHE_TTL_SECONDS: '3600',
    });

    expect(environment).toEqual({
      NODE_ENV: 'development',
      PORT: 3001,
      DATABASE_URL:
        'postgresql://word_explorer:word_explorer@localhost:5432/word_explorer?schema=public',
      CORS_ALLOWED_ORIGINS: 'http://localhost:3000,http://localhost:3002',
      REDIS_HOST: '127.0.0.1',
      REDIS_PORT: 6379,
      REDIS_TTL_SECONDS: 3600,
      THROTTLE_TTL_MS: 60000,
      THROTTLE_LIMIT: 300,
      AUTH_THROTTLE_TTL_MS: 60000,
      AUTH_THROTTLE_LIMIT: 30,
      JWT_SECRET: 'super-secret',
      JWT_EXPIRES_IN: '60m',
      DICTIONARY_API_URL: 'https://api.dictionaryapi.dev/api/v2',
      DICTIONARY_CACHE_TTL_SECONDS: 3600,
    });
  });

  it('should accept Redis URL without host and port', () => {
    const environment = validateEnvironment({
      NODE_ENV: 'production',
      PORT: '3001',
      DATABASE_URL:
        'postgresql://word_explorer:word_explorer@localhost:5432/word_explorer?schema=public',
      CORS_ALLOWED_ORIGINS: 'https://word-explorer.vercel.app',
      REDIS_URL: 'rediss://default:password@redis.example.com:6379',
      REDIS_HOST: '',
      REDIS_PORT: '',
      REDIS_PASSWORD: '',
      REDIS_TTL_SECONDS: '3600',
      THROTTLE_TTL_MS: '60000',
      THROTTLE_LIMIT: '300',
      AUTH_THROTTLE_TTL_MS: '60000',
      AUTH_THROTTLE_LIMIT: '30',
      JWT_SECRET: 'super-secret',
      JWT_EXPIRES_IN: '60m',
      DICTIONARY_API_URL: 'https://api.dictionaryapi.dev/api/v2',
      DICTIONARY_CACHE_TTL_SECONDS: '3600',
    });

    expect(environment.REDIS_URL).toBe(
      'rediss://default:password@redis.example.com:6379',
    );
    expect(environment.REDIS_HOST).toBeUndefined();
    expect(environment.REDIS_PORT).toBeUndefined();
    expect(environment.REDIS_PASSWORD).toBeUndefined();
  });

  it('should throw a clear error when required values are invalid', () => {
    expect(() =>
      validateEnvironment({
        NODE_ENV: 'staging',
        PORT: 'invalid',
        DATABASE_URL: 'not-a-url',
        CORS_ALLOWED_ORIGINS: '',
        REDIS_HOST: '',
        REDIS_PORT: '0',
        REDIS_TTL_SECONDS: '-1',
        THROTTLE_TTL_MS: '-1',
        THROTTLE_LIMIT: '0',
        AUTH_THROTTLE_TTL_MS: '-1',
        AUTH_THROTTLE_LIMIT: '0',
        JWT_SECRET: '',
        JWT_EXPIRES_IN: '',
        DICTIONARY_API_URL: 'ftp://dictionary.example.com',
        DICTIONARY_CACHE_TTL_SECONDS: '-1',
      }),
    ).toThrow(
      'Environment validation failed: "NODE_ENV" must be one of [development, test, production]',
    );
  });
});
