import * as Joi from 'joi';
import {
  type EnvironmentVariables,
  nodeEnvironments,
} from './environment.type';

const hostnameSchema = Joi.alternatives().try(
  Joi.string().hostname(),
  Joi.string().ip({ version: ['ipv4', 'ipv6'] }),
);

const environmentValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid(...nodeEnvironments)
    .default('development'),
  PORT: Joi.number().port().default(3001),
  DATABASE_URL: Joi.string()
    .uri({ scheme: ['postgres', 'postgresql'] })
    .required(),
  REDIS_HOST: hostnameSchema.required(),
  REDIS_PORT: Joi.number().port().required(),
  JWT_SECRET: Joi.string().trim().min(1).required(),
  JWT_EXPIRES_IN: Joi.string().trim().min(1).required(),
  DICTIONARY_API_URL: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .required(),
  DICTIONARY_CACHE_TTL_SECONDS: Joi.number().integer().positive().required(),
});

export function validateEnvironment(
  environment: Record<string, unknown>,
): EnvironmentVariables {
  const validationResult = environmentValidationSchema.validate(environment, {
    abortEarly: false,
    allowUnknown: true,
    convert: true,
  });

  const error = validationResult.error;

  if (error) {
    const details = error.details.map((detail) => detail.message).join('; ');

    throw new Error(`Environment validation failed: ${details}`);
  }

  return validationResult.value as EnvironmentVariables;
}
