import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './server/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    // Direct (non-pooled) connection for migrations — PgBouncer transaction
    // mode breaks some DDL. Falls back to DATABASE_URL if DIRECT_URL is unset.
    url: process.env.DIRECT_URL || process.env.DATABASE_URL!,
  },
});
