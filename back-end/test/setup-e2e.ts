process.env.NODE_ENV = 'test';
process.env.PORT ??= '3001';
if (process.env.TEST_DATABASE_URL) {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
}
process.env.CORS_ALLOWED_ORIGINS ??= 'http://localhost:3000';
process.env.REDIS_HOST ??= '127.0.0.1';
process.env.REDIS_PORT ??= '6379';
if (process.env.TEST_REDIS_HOST) {
  process.env.REDIS_HOST = process.env.TEST_REDIS_HOST;
}
if (process.env.TEST_REDIS_PORT) {
  process.env.REDIS_PORT = process.env.TEST_REDIS_PORT;
}
process.env.REDIS_TTL_SECONDS ??= '60';
process.env.THROTTLE_TTL_MS ??= '60000';
process.env.THROTTLE_LIMIT ??= '60';
process.env.AUTH_THROTTLE_TTL_MS ??= '60000';
process.env.AUTH_THROTTLE_LIMIT ??= '1000';
process.env.JWT_SECRET ??= 'e2e-test-secret';
process.env.JWT_EXPIRES_IN ??= '15m';
process.env.DICTIONARY_API_URL ??= 'https://dictionary.e2e.test/api/v2';
process.env.DICTIONARY_CACHE_TTL_SECONDS ??= '60';
