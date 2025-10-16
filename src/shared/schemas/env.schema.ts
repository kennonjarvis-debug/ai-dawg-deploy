/**
 * Environment Variable Validation Schema
 *
 * This module validates and types all environment variables at runtime
 * using Zod. Import the `env` object to get type-safe, validated env vars.
 *
 * Usage:
 *   import { env } from '@/shared/schemas/env.schema';
 *   const port = env.PORT; // number (guaranteed)
 */

import { z } from 'zod';

// Helper schemas
const portSchema = z.preprocess(
  (val) => (typeof val === 'string' ? parseInt(val, 10) : val),
  z.number().int().positive().max(65535)
);

const booleanSchema = z.preprocess(
  (val) => val === 'true' || val === true,
  z.boolean()
);

const urlSchema = z.string().url().or(z.string().regex(/^http(s)?:\/\/localhost/));

const databaseUrlSchema = z.string().regex(
  /^postgresql:\/\/.+@.+:\d+\/.+/,
  'DATABASE_URL must be a valid PostgreSQL connection string'
);

const redisUrlSchema = z.string().regex(
  /^redis:\/\/.+:\d+/,
  'REDIS_URL must be a valid Redis connection string'
);

const jwtSecretSchema = z.string().min(32, 'JWT_SECRET must be at least 32 characters');

// Main environment schema
const envSchema = z.object({
  // ============================================
  // Server Configuration
  // ============================================
  NODE_ENV: z.enum(['development', 'test', 'production']).default('production'),
  PORT: portSchema.default(3000),
  API_VERSION: z.string().default('v1'),
  HOST: z.string().default('localhost'),

  // ============================================
  // Database
  // ============================================
  DATABASE_URL: databaseUrlSchema,
  PGPASSWORD: z.string().optional(),

  // ============================================
  // Redis
  // ============================================
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: portSchema.default(6379),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_URL: redisUrlSchema.default('redis://localhost:6379'),
  REDIS_DB: z.preprocess(
    (val) => (typeof val === 'string' ? parseInt(val, 10) : val),
    z.number().int().min(0).max(15).default(0)
  ),

  // ============================================
  // JWT & Security
  // ============================================
  JWT_SECRET: jwtSecretSchema,
  JWT_EXPIRES_IN: z.string().default('24h'),
  REFRESH_TOKEN_SECRET: jwtSecretSchema,
  REFRESH_TOKEN_EXPIRES_IN: z.string().default('7d'),
  CSRF_SECRET: z.string().min(32, 'CSRF_SECRET must be at least 32 characters'),

  // ============================================
  // CORS
  // ============================================
  CORS_ORIGIN: z.string().default('http://localhost:5173'),

  // ============================================
  // S3/MinIO
  // ============================================
  S3_ENDPOINT: z.string().optional(),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
  S3_BUCKET_NAME: z.string().optional(),
  S3_REGION: z.string().default('us-east-1'),
  USE_S3: booleanSchema.default(false),

  // ============================================
  // Rate Limiting
  // ============================================
  RATE_LIMIT_WINDOW_MS: z.preprocess(
    (val) => (typeof val === 'string' ? parseInt(val, 10) : val),
    z.number().int().positive().default(900000)
  ),
  RATE_LIMIT_MAX_REQUESTS: z.preprocess(
    (val) => (typeof val === 'string' ? parseInt(val, 10) : val),
    z.number().int().positive().default(100)
  ),

  // ============================================
  // File Upload
  // ============================================
  MAX_FILE_SIZE: z.preprocess(
    (val) => (typeof val === 'string' ? parseInt(val, 10) : val),
    z.number().int().positive().default(104857600)
  ),
  UPLOAD_DIR: z.string().default('./uploads'),

  // ============================================
  // WebSocket
  // ============================================
  WS_HEARTBEAT_INTERVAL: z.preprocess(
    (val) => (typeof val === 'string' ? parseInt(val, 10) : val),
    z.number().int().positive().default(30000)
  ),
  WS_HEARTBEAT_TIMEOUT: z.preprocess(
    (val) => (typeof val === 'string' ? parseInt(val, 10) : val),
    z.number().int().positive().default(60000)
  ),

  // ============================================
  // Job Queue
  // ============================================
  QUEUE_CONCURRENCY: z.preprocess(
    (val) => (typeof val === 'string' ? parseInt(val, 10) : val),
    z.number().int().positive().default(5)
  ),
  QUEUE_MAX_RETRY: z.preprocess(
    (val) => (typeof val === 'string' ? parseInt(val, 10) : val),
    z.number().int().nonnegative().default(3)
  ),

  // ============================================
  // Logging
  // ============================================
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug', 'verbose']).default('info'),
  LOG_DIR: z.string().default('./logs'),

  // ============================================
  // AI Services
  // ============================================
  VOCAL_COACH_URL: urlSchema.default('http://localhost:8000'),
  PRODUCER_AI_URL: urlSchema.default('http://localhost:8001'),
  PRODUCER_URL: urlSchema.default('http://localhost:8001'),
  MASTERING_URL: urlSchema.optional(),

  // ============================================
  // Stripe
  // ============================================
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  STRIPE_PRICE_PRO: z.string().optional(),
  STRIPE_PRICE_STUDIO: z.string().optional(),

  // ============================================
  // Billing URLs
  // ============================================
  BILLING_SUCCESS_URL: z.string().optional(),
  BILLING_CANCEL_URL: z.string().optional(),
  BILLING_PORTAL_RETURN_URL: z.string().optional(),
  BILLING_UPGRADE_URL: z.string().optional(),
  BILLING_PORTAL_FALLBACK_URL: z.string().optional(),

  // ============================================
  // Email
  // ============================================
  SMTP_HOST: z.string().default('localhost'),
  SMTP_PORT: portSchema.default(1025),
  EMAIL_FROM: z.string().email().default('test@aidaw.com'),

  // ============================================
  // Feature Flags
  // ============================================
  FEATURE_REQUIRE_APPROVAL_FOR_PRIVILEGED: booleanSchema.default(true),
  FEATURE_ENABLE_WEBAUTHN: booleanSchema.default(true),
  FEATURE_ENABLE_OTP_2FA: booleanSchema.default(true),
  FEATURE_ENFORCE_RATE_LIMITS: booleanSchema.default(true),
  FEATURE_ENABLE_TRACING: booleanSchema.default(true),
  FEATURE_ENABLE_METRICS: booleanSchema.default(true),
  FEATURE_ENABLE_AUDIT_LOGGING: booleanSchema.default(true),
  FEATURE_ENABLE_AI_BRAIN: booleanSchema.default(true),
  FEATURE_ENABLE_VOCAL_COACH: booleanSchema.default(true),
  FEATURE_ENABLE_PRODUCER_AI: booleanSchema.default(true),
  FEATURE_AI_REQUIRE_VERIFICATION: booleanSchema.default(true),
  FEATURE_ENABLE_COLLABORATION: booleanSchema.default(false),
  FEATURE_ENABLE_REALTIME_SYNC: booleanSchema.default(false),
  FEATURE_ENABLE_CLOUD_EXPORT: booleanSchema.default(false),

  // ============================================
  // ChatGPT App
  // ============================================
  CHATGPT_APP_KEY: z.string().optional(),
  CHATGPT_APP_ENABLED: booleanSchema.default(false),

  // ============================================
  // Testing/E2E
  // ============================================
  E2E_TESTING: booleanSchema.default(false),
  BASE_URL: z.string().optional(),
  API_URL: z.string().optional(),
  DISABLE_RATE_LIMIT_IN_DEV: booleanSchema.default(false),
  DISABLE_CSRF_IN_DEV: booleanSchema.default(false),

  // ============================================
  // Vite/Frontend (optional, may not be present in backend-only env)
  // ============================================
  VITE_API_URL: z.string().optional(),
  VITE_PORT: portSchema.optional(),
  VITE_WS_URL: z.string().optional(),
  VITE_MAX_TERMINALS: z.preprocess(
    (val) => (typeof val === 'string' ? parseInt(val, 10) : val),
    z.number().int().positive().optional()
  ),
  VITE_TERMINAL_SCROLLBACK: z.preprocess(
    (val) => (typeof val === 'string' ? parseInt(val, 10) : val),
    z.number().int().positive().optional()
  ),
});

// Parse and validate environment variables
// This will throw an error if validation fails, preventing app startup with invalid config
export const env = envSchema.parse(process.env);

// Export the type for use in other parts of the application
export type Env = z.infer<typeof envSchema>;

// Export the schema itself for testing or additional validation
export { envSchema };
