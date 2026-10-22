import { PrismaClient } from '@prisma/client';
import { env } from '../env';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const prisma =
  global.prisma ||
  new PrismaClient({
    // Query logs are noisy and can contain user data; in production only errors and warnings.
    log: env.isProd ? ['error', 'warn'] : ['error'],
  });

// Reuse one client across hot reloads in development, otherwise every save opens a new pool.
if (!env.isProd) global.prisma = prisma;

/** Whether the last connection attempt worked. /api/health reports it so the web app can fall back to demo mode. */
export let databaseReady = false;

export async function connectDB() {
  if (!env.databaseUrl) {
    console.warn('⚠️  DATABASE_URL is not set. API will run, report the database as unavailable, and the web app will use demo data.');
    return;
  }
  try {
    await prisma.$connect();
    // $connect can succeed against a reachable server whose database is empty or
    // un-migrated, so prove a real query works before claiming the app is ready.
    await prisma.$queryRaw`SELECT 1`;
    databaseReady = true;
    console.log('✅ PostgreSQL connected.');
  } catch (err) {
    console.error('❌ Could not connect to PostgreSQL. The web app will fall back to demo data.', err);
  }
}
