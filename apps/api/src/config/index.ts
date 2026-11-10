import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('4000').transform((v) => parseInt(v, 10)),
  HOST: z.string().default('0.0.0.0'),
  DATABASE_URL: z.string().optional(),
  DB_HOST: z.string().default('localhost'),
  DB_PORT: z.string().default('5432').transform((v) => parseInt(v, 10)),
  DB_USER: z.string().default('postgres'),
  DB_PASSWORD: z.string().default('postgres'),
  DB_NAME: z.string().default('algions_db'),
  DB_POOL_MIN: z.string().default('2').transform((v) => parseInt(v, 10)),
  DB_POOL_MAX: z.string().default('20').transform((v) => parseInt(v, 10)),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters long').default('development_jwt_secret_32_characters_long_min'),
  JWT_EXPIRES_IN: z.string().default('24h'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  CORS_ORIGIN: z.string().default('http://localhost:3000,http://localhost:80,https://localhost,https://algions.com'),
  ADMIN_USERNAME: z.string().default('admin@algions.com'),
  ADMIN_PASSWORD: z.string().default('AdminSecretPassword123!'),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('❌ FATAL: Environment validation failed:');
  console.error(JSON.stringify(parsedEnv.error.format(), null, 2));
  process.exit(1);
}

export const config = parsedEnv.data;

export function getDatabaseConnectionString(): string {
  if (config.DATABASE_URL) {
    return config.DATABASE_URL;
  }
  return `postgresql://${config.DB_USER}:${encodeURIComponent(config.DB_PASSWORD)}@${config.DB_HOST}:${config.DB_PORT}/${config.DB_NAME}`;
}
