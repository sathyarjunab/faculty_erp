import dotenv from 'dotenv';

dotenv.config();

/**
 * Centralized, validated environment configuration.
 * Everything that reads process.env should read it from here instead,
 * so the rest of the codebase depends on a single typed config object.
 */

const toBool = (value: string | undefined, fallback = false): boolean => {
  if (value === undefined || value === null || value === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
};

const toInt = (value: string | undefined, fallback: number): number => {
  const parsed = parseInt(value ?? '', 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

export interface GradeBand {
  grade: string;
  min: number;
}

const config = {
  env: process.env.NODE_ENV || 'development',
  isProduction: (process.env.NODE_ENV || 'development') === 'production',
  port: toInt(process.env.PORT, 5000),
  clientUrls: (process.env.CLIENT_URL || 'http://localhost:5173')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),

  db: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: toInt(process.env.DB_PORT, 3306),
    name: process.env.DB_NAME || 'faculty_ams',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    logging: toBool(process.env.DB_LOGGING, false),
  },

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'dev_access_secret',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '1d',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },

  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
  },

  otp: {
    length: toInt(process.env.OTP_LENGTH, 6),
    expiresMinutes: toInt(process.env.OTP_EXPIRES_MINUTES, 5),
    maxAttempts: toInt(process.env.OTP_MAX_ATTEMPTS, 5),
  },

  smtp: {
    host: process.env.SMTP_HOST || '',
    port: toInt(process.env.SMTP_PORT, 587),
    secure: toBool(process.env.SMTP_SECURE, false),
    user: process.env.SMTP_USER || '',
    password: process.env.SMTP_PASSWORD || '',
    from: process.env.MAIL_FROM || 'Faculty AMS <no-reply@faculty-ams.local>',
  },

  grading: {
    passPercentage: toInt(process.env.PASS_PERCENTAGE, 40),
    // band => minimum percentage (inclusive). Evaluated high → low.
    bands: [
      { grade: 'A+', min: 90 },
      { grade: 'A', min: 80 },
      { grade: 'B', min: 70 },
      { grade: 'C', min: 60 },
      { grade: 'D', min: 40 },
      { grade: 'F', min: 0 },
    ] as GradeBand[],
  },
};

export type AppConfig = typeof config;

export default config;
