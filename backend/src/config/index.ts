/**
 * Northstar Configuration
 * Centralized configuration management
 */

import dotenv from 'dotenv';
import type { AppConfig } from '../types';

// Load environment variables
dotenv.config();

const config: AppConfig = {
  port: parseInt(process.env.PORT || '3000', 10),
  env: (process.env.NODE_ENV as 'development' | 'staging' | 'production') || 'development',

  apiKeys: {
    congressGov: process.env.CONGRESS_GOV_API_KEY || '',
    gemini: process.env.GEMINI_API_KEY,
    trulifai: process.env.TRULIFAI_API_KEY,
    openSecrets: process.env.OPENSECRETS_API_KEY,
    census: process.env.CENSUS_API_KEY,
  },

  database: {
    url: process.env.DATABASE_URL || 'postgresql://localhost:5432/northstar_dev',
  },

  redis: process.env.REDIS_URL
    ? {
        host: new URL(process.env.REDIS_URL).hostname,
        port: parseInt(new URL(process.env.REDIS_URL).port, 10),
        password: new URL(process.env.REDIS_URL).password || undefined,
      }
    : undefined,

  cache: {
    ttl: parseInt(process.env.CACHE_TTL || '1800', 10), // 30 minutes default
    enabled: process.env.CACHE_ENABLED !== 'false',
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10), // 100 requests per window
  },
};

// Validate required configuration
function validateConfig(): void {
  const requiredKeys = ['congressGov'];
  const missing: string[] = [];

  requiredKeys.forEach((key) => {
    if (!config.apiKeys[key as keyof typeof config.apiKeys]) {
      missing.push(`CONGRESS_GOV_API_KEY`);
    }
  });

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

// Only validate in production
if (config.env === 'production') {
  validateConfig();
}

export default config;
