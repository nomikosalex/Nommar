import { defineConfig, env } from '@prisma/config';

// Load .env into process.env (Prisma 7 no longer does this automatically here).
try {
  process.loadEnvFile();
} catch {
  /* .env optional */
}

// Prisma 7 moves the datasource URL out of schema.prisma into this config.
export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    // Migrations use the DIRECT (non-pooled) connection; the app runtime uses
    // the pooled DATABASE_URL via the driver adapter.
    url: env('DIRECT_URL'),
  },
  migrations: {
    seed: 'tsx prisma/seed.ts',
  },
});
