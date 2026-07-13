export const nodeEnvironments = ['development', 'test', 'production'] as const;

export type NodeEnvironment = (typeof nodeEnvironments)[number];

export interface EnvironmentVariables {
  NODE_ENV: NodeEnvironment;
  PORT: number;
  DATABASE_URL: string;
  CORS_ALLOWED_ORIGINS: string;
  REDIS_HOST: string;
  REDIS_PORT: number;
  REDIS_TTL_SECONDS: number;
  THROTTLE_TTL_MS: number;
  THROTTLE_LIMIT: number;
  AUTH_THROTTLE_TTL_MS: number;
  AUTH_THROTTLE_LIMIT: number;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  DICTIONARY_API_URL: string;
  DICTIONARY_CACHE_TTL_SECONDS: number;
}
