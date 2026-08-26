import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Resolve directory of the current module to locate the root .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '.env');

// Load environment variables from the single root .env file
dotenv.config({ path: envPath });

export const env = {
  DATABASE_URL: process.env.DATABASE_URL || 'file:./dev.db?connection_limit=1&socket_timeout=30',
  PORT: parseInt(process.env.PORT || '4000', 10),
  EXPRESS_PORT: parseInt(process.env.EXPRESS_PORT || '4001', 10),
  SMTP_HOST: process.env.SMTP_HOST || '',
  SMTP_PORT: parseInt(process.env.SMTP_PORT || '587', 10),
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  SMTP_SECURE: process.env.SMTP_SECURE === 'true' || parseInt(process.env.SMTP_PORT || '587', 10) === 465,
  EMAIL_FROM: process.env.EMAIL_FROM || 'NEURON_FLOW Automation <noreply@neuronflow.local>',
  RABBITMQ_URL: process.env.RABBITMQ_URL ? process.env.RABBITMQ_URL.trim() : '',
  RABBITMQ_QUEUE_NAME: process.env.RABBITMQ_QUEUE_NAME || 'neuron_flow_queue',
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || 'mock-key',
  BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET || 'fallback_auth_secret_key_neuron_flow_12345',
  GOOGLE_CLIENT_EMAIL: process.env.GOOGLE_CLIENT_EMAIL || 'mock-client@developer.gserviceaccount.com',
  ENCRYPTION_KEY: process.env.ENCRYPTION_KEY || 'abcdefghijklmnopqrstuvwxyz123456',
  AWS_REGION: process.env.AWS_REGION || 'us-east-1',
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID || '',
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY || '',
  AWS_S3_BUCKET_NAME: process.env.AWS_S3_BUCKET_NAME || 'neuron-vault-shares',
  AWS_S3_CUSTOM_DOMAIN: process.env.AWS_S3_CUSTOM_DOMAIN || '',
  AWS_S3_ENDPOINT: process.env.AWS_S3_ENDPOINT || '',
  STORAGE_PROVIDER: process.env.STORAGE_PROVIDER || 's3',
};

export default env;
