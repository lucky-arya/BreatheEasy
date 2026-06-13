import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

interface Config {
  env: string;
  port: number;
  mongodbUri: string;
  mlServiceUrl: string;
  openaqApiKey: string;
  jwt: {
    secret: string;
    expiresIn: string;
  };
  vapid: {
    publicKey: string;
    privateKey: string;
    subject: string;
  };
  cron: {
    enabled: boolean;
    ingestionInterval: string;
  };
}

const config: Config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/breatheeasy',
  mlServiceUrl: process.env.ML_SERVICE_URL || 'http://localhost:8000',
  openaqApiKey: process.env.OPENAQ_API_KEY || '',
  jwt: {
    secret: process.env.JWT_SECRET || 'default-secret-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  vapid: {
    publicKey: process.env.VAPID_PUBLIC_KEY || '',
    privateKey: process.env.VAPID_PRIVATE_KEY || '',
    subject: process.env.VAPID_SUBJECT || 'mailto:admin@breatheeasy.com',
  },
  cron: {
    enabled: process.env.CRON_ENABLED === 'true',
    ingestionInterval: process.env.CRON_INGESTION_INTERVAL || '*/10 * * * *',
  },
};

export default config;
