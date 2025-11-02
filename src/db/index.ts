import { config } from 'dotenv'

import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'

import * as schema from './schema.ts'

config()

const DATABASE_URL = process.env.VITE_DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error(
    'DATABASE_URL or VITE_DATABASE_URL environment variable is required. ' +
    'Please set it in your .env.local file. ' +
    'Format: postgresql://username:password@host:port/database'
  )
}

// Validate DATABASE_URL format
if (!DATABASE_URL.startsWith('postgresql://') && !DATABASE_URL.startsWith('postgres://')) {
  throw new Error(
    'DATABASE_URL must start with postgresql:// or postgres://. ' +
    `Current value: ${DATABASE_URL.substring(0, 20)}...`
  )
}

const pool = new Pool({
  connectionString: DATABASE_URL,
})

export const db = drizzle(pool, { schema })
