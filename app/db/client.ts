import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

/**
 * Database client instance
 * Uses the DATABASE_URL environment variable to connect to PostgreSQL
 */
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}

// Create the postgres client
// Supabase requires SSL; we add the corresponding option
// Configure timeouts to prevent statement timeout errors
// max: maximum number of connections in the pool (default: 10)
// idle_timeout: how long a connection can be idle before being closed (default: 0 = never)
// max_lifetime: maximum lifetime of a connection (default: 0 = forever)
// 
// IMPORTANT: Supabase has a default statement_timeout of 60 seconds.
// If you're experiencing "canceling statement due to statement timeout" errors:
// 1. Increase the statement_timeout in Supabase dashboard:
//    - Go to Settings > Database > Connection Pooling
//    - Or run: ALTER DATABASE your_db SET statement_timeout = '120s';
// 2. Optimize slow queries (ensure indexes are being used)
// 3. Use pagination for large datasets
// 4. Check for N+1 query problems
const client = postgres(connectionString, {
  ssl: 'require',
  max: 10, // Maximum number of connections in the pool
  idle_timeout: 20, // Close idle connections after 20 seconds
  max_lifetime: 60 * 30, // Close connections after 30 minutes
  connect_timeout: 10, // Connection timeout in seconds (10 seconds)
});

// Create the drizzle instance
export const db = drizzle(client, { schema });
