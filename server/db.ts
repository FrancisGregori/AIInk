import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

let pool: Pool | null = null;

if (!process.env.DATABASE_URL) {
  console.error(
    "DATABASE_URL must be set. Database features will be disabled.",
  );
} else {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10, // Aumentar conexiones para producción
    idleTimeoutMillis: 30000, // 30 segundos
    connectionTimeoutMillis: 15000, // 15 segundos timeout - AUMENTADO para evitar errores en producción
  });
}

export const db: any = pool
  ? drizzle({ client: pool, schema })
  : new Proxy(
      {},
      {
        get() {
          throw new Error(
            "Database unavailable: DATABASE_URL not configured",
          );
        },
      },
    );

export { pool };
