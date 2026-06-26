import { defineConfig } from 'drizzle-kit';
import 'dotenv/config';

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    host: process.env.SQL_HOST || 'localhost',
    user: process.env.SQL_USER || 'postgres',
    password: process.env.SQL_PASSWORD || 'password',
    database: process.env.SQL_DB_NAME || 'pulso_erp',
    ssl: false,
  },
});
