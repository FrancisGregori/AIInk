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

export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 10, // Aumentar conexiones para producción
  idleTimeoutMillis: 30000, // 30 segundos
  connectionTimeoutMillis: 15000, // 15 segundos timeout - AUMENTADO para evitar errores en producción
});
export const db = drizzle({ client: pool, schema });
