import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Check if we're using Railway PostgreSQL (internal network)
const isRailwayInternal = process.env.DATABASE_URL?.includes('railway.internal');

if (isRailwayInternal) {
  console.log('[Database] Railway internal connection detected - disabling WebSocket');
  // For Railway internal connections, force fetch and disable WebSocket completely
  neonConfig.poolQueryViaFetch = true;  // Force fetch instead of WebSocket
  neonConfig.fetchConnectionCache = true;  // Enable connection caching
  neonConfig.webSocketConstructor = undefined; // Explicitly disable WebSocket
} else {
  console.log('[Database] Standard connection - enabling WebSocket');
  neonConfig.webSocketConstructor = ws;
  neonConfig.poolQueryViaFetch = false;
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

export const db = drizzle({ client: pool, schema });
