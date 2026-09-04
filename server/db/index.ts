import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Create postgres connection
// Using pgBouncer transaction mode, so prepare: false
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not set');
}

const client = postgres(connectionString, { 
  prepare: false,
  max: 10, // connection pool size
});

export const db = drizzle(client, { schema });

// Export schema for use in server routes
export { schema };