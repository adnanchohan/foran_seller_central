import 'dotenv/config';
import path from 'node:path';
import { z } from 'zod';

const environmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),
  CLIENT_ORIGIN: z.string().url().default('http://localhost:5173'),
  MONGODB_URI: z.string().min(1),
  FIREBASE_PROJECT_ID: z.string().min(1),
  FIREBASE_CLIENT_EMAIL: z.string().email(),
  FIREBASE_PRIVATE_KEY: z.string().min(1),
  ALLOWED_AUTH_PROVIDERS: z.string().default('google.com'),
  ADMIN_EMAILS: z.string().default(''),
  UPLOAD_DIRECTORY: z.string().default('uploads'),
  MAX_UPLOAD_MB: z.coerce.number().positive().max(25).default(10),
});

const parsedEnvironment = environmentSchema.safeParse(process.env);

if (!parsedEnvironment.success) {
  const details = parsedEnvironment.error.issues
    .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
    .join('\n');
  throw new Error(`Invalid server environment configuration:\n${details}`);
}

const raw = parsedEnvironment.data;

export const env = {
  nodeEnv: raw.NODE_ENV,
  port: raw.PORT,
  clientOrigin: raw.CLIENT_ORIGIN,
  mongoUri: raw.MONGODB_URI,
  firebaseProjectId: raw.FIREBASE_PROJECT_ID,
  firebaseClientEmail: raw.FIREBASE_CLIENT_EMAIL,
  firebasePrivateKey: raw.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  allowedAuthProviders: raw.ALLOWED_AUTH_PROVIDERS.split(',')
    .map((provider) => provider.trim())
    .filter(Boolean),
  adminEmails: raw.ADMIN_EMAILS.split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean),
  uploadDirectory: path.resolve(process.cwd(), raw.UPLOAD_DIRECTORY),
  maxUploadBytes: raw.MAX_UPLOAD_MB * 1024 * 1024,
};
