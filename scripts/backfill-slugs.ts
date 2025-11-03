#!/usr/bin/env tsx
/**
 * Backfill script to generate slugs for existing courses
 * 
 * Run with: pnpm tsx scripts/backfill-slugs.ts
 */

import { db } from '../src/db/index'
import { classes } from '../src/db/schema'
import { generateSlug, ensureUniqueSlug } from '../src/lib/slug'
import { eq, isNull, or } from 'drizzle-orm'

async function backfillSlugs() {
  console.log('Starting slug backfill...\n')

  // Get all classes, including those without slugs
  const allClasses = await db.select().from(classes)
  
  if (allClasses.length === 0) {
    console.log('No classes found. Nothing to backfill.\n')
    process.exit(0)
  }

  console.log(`Found ${allClasses.length} classes to process\n`)

  let slugsCreated = 0
  let slugsUpdated = 0
  const allSlugs: string[] = []

  for (const classItem of allClasses) {
    // Skip if slug already exists and is not empty
    if (classItem.slug && classItem.slug.trim() !== '') {
      allSlugs.push(classItem.slug)
      console.log(`   - Class already has slug: ${classItem.title} (${classItem.slug})`)
      continue
    }

    // Generate slug from title
    const baseSlug = generateSlug(classItem.title)
    
    // Ensure uniqueness against all existing slugs (including ones we just added)
    const uniqueSlug = ensureUniqueSlug(baseSlug, allSlugs)
    allSlugs.push(uniqueSlug)

    // Update the class with the new slug
    await db
      .update(classes)
      .set({ slug: uniqueSlug })
      .where(eq(classes.id, classItem.id))

    slugsCreated++
    console.log(`   ✓ Generated slug for: ${classItem.title} → ${uniqueSlug}`)
  }

  // Summary
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('Backfill Summary:')
  console.log(`  Total classes: ${allClasses.length}`)
  console.log(`  New slugs created: ${slugsCreated}`)
  console.log(`  Already had slugs: ${allClasses.length - slugsCreated}`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  console.log('✓ Slug backfill completed successfully!')
  
  process.exit(0)
}

// Run the script
backfillSlugs().catch((error) => {
  console.error('❌ Error during slug backfill:', error)
  process.exit(1)
})
