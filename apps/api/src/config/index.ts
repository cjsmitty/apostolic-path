import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  PORT: z.coerce.number().default(3001),
  HOST: z.string().default('0.0.0.0'),

  // AWS
  AWS_REGION: z.string().default('us-east-1'),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),

  // DynamoDB
  DYNAMODB_ENDPOINT: z.string().optional(),
  DYNAMODB_TABLE_PREFIX: z.string().default('apostolic-path'),

  // Cognito
  COGNITO_USER_POOL_ID: z.string().optional(),
  COGNITO_CLIENT_ID: z.string().optional(),
  COGNITO_REGION: z.string().default('us-east-1'),

  // S3
  S3_BUCKET: z.string().default('apostolic-path-uploads'),
  S3_ENDPOINT: z.string().optional(),

  // JWT (local dev)
  JWT_SECRET: z.string().default('dev-secret-change-in-production'),

  // Logging
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
});

const parseEnv = () => {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('❌ Invalid environment variables:');
    console.error(result.error.format());
    process.exit(1);
  }

  return result.data;
};

const env = parseEnv();

export const config = {
  nodeEnv: env.NODE_ENV,
  port: env.PORT,
  host: env.HOST,
  logLevel: env.LOG_LEVEL,

  corsOrigins:
    env.NODE_ENV === 'development' ? ['http://localhost:3000', 'http://127.0.0.1:3000'] : [],

  aws: {
    region: env.AWS_REGION,
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  },

  dynamodb: {
    endpoint: env.DYNAMODB_ENDPOINT,
    tablePrefix: env.DYNAMODB_TABLE_PREFIX,
  },

  cognito: {
    userPoolId: env.COGNITO_USER_POOL_ID,
    clientId: env.COGNITO_CLIENT_ID,
    region: env.COGNITO_REGION,
  },

  s3: {
    bucket: env.S3_BUCKET,
    endpoint: env.S3_ENDPOINT,
  },

  jwt: {
    secret: env.JWT_SECRET,
  },
} as const;

export type Config = typeof config;
