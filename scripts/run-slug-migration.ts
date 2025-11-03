#!/usr/bin/env tsx
/**
 * Run the slug migration SQL script
 * Usage: pnpm tsx scripts/run-slug-migration.ts
 */

import { config } from 'dotenv'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

// Load environment variables
config({ path: '.env.local' })
config({ path: '.env' })

const DATABASE_URL = process.env.VITE_DATABASE_URL

if (!DATABASE_URL) {
  console.error('❌ Error: VITE_DATABASE_URL environment variable is not set')
  console.error('Please set it in your .env.local or .env file')
  process.exit(1)
}

async function runMigration() {
  try {
    const { Client } = await import('pg')
    const client = new Client({
      connectionString: DATABASE_URL,
    })

    await client.connect()
    console.log('✓ Connected to database')

    // Read and execute the SQL migration file
    const __filename = fileURLToPath(import.meta.url)
    const __dirname = dirname(__filename)
    const sqlPath = join(__dirname, '../db/migrations/add-slug-to-classes.sql')
    const sql = readFileSync(sqlPath, 'utf-8')

    console.log('Running migration...')
    await client.query(sql)
    
    console.log('✓ Migration completed successfully!')
    console.log('\nVerifying results...')
    
    // Show a few examples
    const result = await client.query('SELECT id, title, slug FROM classes LIMIT 5')
    console.log('\nSample courses with slugs:')
    result.rows.forEach((row: any) => {
      console.log(`  ${row.title} → ${row.slug}`)
    })

    await client.end()
    console.log('\n✓ Migration complete! You can now run: pnpm db:push (it will not truncate)')
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

runMigration()

