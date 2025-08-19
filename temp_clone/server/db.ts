import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Optimized pool configuration for Neon + Autoscale
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 3, // Limit concurrent connections for Neon free tier
  idleTimeoutMillis: 30000, // Close idle connections after 30s
  connectionTimeoutMillis: 5000, // Timeout connection attempts after 5s
});

export const db = drizzle({ client: pool, schema });
