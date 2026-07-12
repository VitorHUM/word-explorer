import { validateEnvironment } from './environment-config.validator';

describe('validateEnvironment', () => {
  it('should return a typed environment for valid values', () => {
    const environment = validateEnvironment({
      NODE_ENV: 'development',
      PORT: '3001',
      DATABASE_URL:
        'postgresql://word_explorer:word_explorer@localhost:5432/word_explorer?schema=public',
      REDIS_HOST: '127.0.0.1',
      REDIS_PORT: '6379',
      JWT_SECRET: 'super-secret',
      JWT_EXPIRES_IN: '15m',
      DICTIONARY_API_URL: 'https://api.dictionaryapi.dev/api/v2/entries/en',
      DICTIONARY_CACHE_TTL_SECONDS: '3600',
    });

    expect(environment).toEqual({
      NODE_ENV: 'development',
      PORT: 3001,
      DATABASE_URL:
        'postgresql://word_explorer:word_explorer@localhost:5432/word_explorer?schema=public',
      REDIS_HOST: '127.0.0.1',
      REDIS_PORT: 6379,
      JWT_SECRET: 'super-secret',
      JWT_EXPIRES_IN: '15m',
      DICTIONARY_API_URL: 'https://api.dictionaryapi.dev/api/v2/entries/en',
      DICTIONARY_CACHE_TTL_SECONDS: 3600,
    });
  });

  it('should throw a clear error when required values are invalid', () => {
    expect(() =>
      validateEnvironment({
        NODE_ENV: 'staging',
        PORT: 'invalid',
        DATABASE_URL: 'not-a-url',
        REDIS_HOST: '',
        REDIS_PORT: '0',
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
