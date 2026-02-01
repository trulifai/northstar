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
  console.error('❌ DATABASE_URL not found in environment!');
  console.error('Current env:', process.env);
}

// Create and export Prisma Client
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

// Handle cleanup on shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});
