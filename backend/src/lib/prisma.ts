/**
 * Prisma Client Singleton
 * Ensures environment variables are loaded before initializing client
 */

import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

// Load environment variables FIRST
dotenv.config();

// Verify DATABASE_URL is loaded
if (!process.env.DATABASE_URL) {
  console.warn('DATABASE_URL not set. DB-backed routes will fail unless live API mode is enabled.');
}

// Create and export Prisma Client
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

// Handle cleanup on shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});
