import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres, { type Sql } from 'postgres';

type PostgresClient = Sql<Record<string, unknown>>;

let cachedDb: PostgresJsDatabase<Record<string, unknown>> | null = null;
// eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
let cachedClient: PostgresClient | null = null;

export function getDb() {
  if (cachedDb) {
    return cachedDb;
  }

  const connectionString = process.env.SUPABASE_DB_URL;

  if (!connectionString) {
    throw new Error('SUPABASE_DB_URL est requis pour initialiser Drizzle.');
  }

  cachedClient = postgres<Record<string, unknown>>(connectionString, { prepare: false });
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  cachedDb = drizzle(cachedClient);

  return cachedDb;
}
