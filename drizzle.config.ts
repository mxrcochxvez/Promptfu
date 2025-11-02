import { config } from 'dotenv'
import { defineConfig } from 'drizzle-kit'

config()

const DATABASE_URL = process.env.VITE_DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error(
    'DATABASE_URL or VITE_DATABASE_URL environment variable is required. ' +
    'Please set it in your .env.local file.'
  )
}

export default defineConfig({
  out: './drizzle',
  schema: './src/db/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: DATABASE_URL,
  },
})
