import dotenv from 'dotenv';
dotenv.config();

import * as schema from '@shared/schema';

// Use a importação padrão do "pg" e extraia a propriedade Pool
import pg from 'pg';
const { Pool: PgPool } = pg;

import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres';

import { Pool as NeonPool, neonConfig } from '@neondatabase/serverless';
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-serverless';
import ws from 'ws';

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}

let pool: any, db: any;

if (process.env.DATABASE_MODE === 'local') {
  // Implementação para ambiente local usando pg e drizzle-orm/node-postgres
  pool = new PgPool({ connectionString: process.env.DATABASE_URL });
  db = drizzlePg(pool, { schema });
} else {
  // Implementação para ambiente serverless usando @neondatabase/serverless e drizzle-orm/neon-serverless
  neonConfig.webSocketConstructor = ws;
  pool = new NeonPool({ connectionString: process.env.DATABASE_URL });
  db = drizzleNeon({ client: pool, schema });
}

export { pool, db };
