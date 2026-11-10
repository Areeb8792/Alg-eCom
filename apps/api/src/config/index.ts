import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

export const DEV_DEFAULT_SECRET = 'development_jwt_secret_32_characters_long_min';

export const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z
      .union([z.string(), z.number()])
      .default('4000')
      .transform((v) => (typeof v === 'number' ? v : parseInt(v, 10))),
    HOST: z.string().default('0.0.0.0'),
    DATABASE_URL: z.string().default('postgresql://algions_user:algions_password@127.0.0.1:5432/algions_db'),
    DB_HOST: z.string().default('127.0.0.1'),
    DB_PORT: z
      .union([z.string(), z.number()])
      .default('5432')
      .transform((v) => (typeof v === 'number' ? v : parseInt(v, 10))),
    DB_USER: z.string().default('algions_user'),
    DB_PASSWORD: z.string().default('algions_password'),
    DB_NAME: z.string().default('algions_db'),
    DB_POOL_MIN: z
      .union([z.string(), z.number()])
      .default('2')
      .transform((v) => (typeof v === 'number' ? v : parseInt(v, 10))),
    DB_POOL_MAX: z
      .union([z.string(), z.number()])
      .default('20')
      .transform((v) => (typeof v === 'number' ? v : parseInt(v, 10))),
    JWT_SECRET: z.string().optional(),
    JWT_EXPIRES_IN: z.string().default('24h'),
    LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
    CORS_ORIGIN: z.string().optional(),
    ADMIN_USERNAME: z.string().default('admin@algions.com'),
    ADMIN_PASSWORD: z.string().default('AdminSecretPassword123!'),
  })
  .superRefine((data, ctx) => {
    // 1. JWT_SECRET Validation
    if (data.NODE_ENV === 'production') {
      if (!data.JWT_SECRET || data.JWT_SECRET.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['JWT_SECRET'],
          message: 'FATAL: JWT_SECRET must be explicitly set in production environments.',
        });
      } else if (data.JWT_SECRET === DEV_DEFAULT_SECRET) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['JWT_SECRET'],
          message: 'FATAL: Development default JWT_SECRET cannot be used in production.',
        });
      } else if (data.JWT_SECRET.length < 32) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['JWT_SECRET'],
          message: 'FATAL: JWT_SECRET must be at least 32 characters long in production.',
        });
      }
    }

    // 2. CORS_ORIGIN Validation
    if (data.NODE_ENV === 'production' && data.CORS_ORIGIN) {
      const origins = data.CORS_ORIGIN.split(',').map((o) => o.trim());
      if (origins.includes('*')) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['CORS_ORIGIN'],
          message: 'FATAL: Wildcard CORS_ORIGIN (*) is strictly forbidden in production.',
        });
      }
    }
  });

export type Config = {
  NODE_ENV: 'development' | 'production' | 'test';
  PORT: number;
  HOST: string;
  DATABASE_URL: string;
  DB_HOST: string;
  DB_PORT: number;
  DB_USER: string;
  DB_PASSWORD: string;
  DB_NAME: string;
  DB_POOL_MIN: number;
  DB_POOL_MAX: number;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  LOG_LEVEL: 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace';
  CORS_ORIGIN: string;
  ADMIN_USERNAME: string;
  ADMIN_PASSWORD: string;
};

export function parseConfig(rawEnv: Record<string, unknown> = process.env): Config {
  const parsed = envSchema.safeParse(rawEnv);
  if (!parsed.success) {
    throw new Error(`Environment validation failed:\n${JSON.stringify(parsed.error.format(), null, 2)}`);
  }

  const data = parsed.data;

  // Environment-restricted default for development / test only
  const jwtSecret =
    data.JWT_SECRET && data.JWT_SECRET.trim() !== ''
      ? data.JWT_SECRET
      : data.NODE_ENV === 'production'
      ? ''
      : 'development_jwt_secret_32_characters_long_min';

  // Environment-restricted default for CORS_ORIGIN
  const defaultCors =
    data.NODE_ENV === 'production'
      ? 'https://algions.com,https://localhost,http://localhost'
      : 'http://localhost:3000,http://127.0.0.1:3000,http://localhost:80,http://127.0.0.1:80,http://localhost:4000,http://127.0.0.1:4000,https://localhost,https://127.0.0.1,https://algions.com';

  const corsOrigin = data.CORS_ORIGIN && data.CORS_ORIGIN.trim() !== '' ? data.CORS_ORIGIN : defaultCors;

  return {
    ...data,
    JWT_SECRET: jwtSecret,
    CORS_ORIGIN: corsOrigin,
  };
}

let activeConfig: Config;
try {
  activeConfig = parseConfig(process.env);
} catch (error) {
  console.error('❌ FATAL: Environment validation failed:');
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}

export const config = activeConfig;

export function getDatabaseConnectionString(): string {
  if (config.DATABASE_URL) {
    return config.DATABASE_URL;
  }
  return `postgresql://${config.DB_USER}:${encodeURIComponent(config.DB_PASSWORD)}@${config.DB_HOST}:${config.DB_PORT}/${config.DB_NAME}`;
}
