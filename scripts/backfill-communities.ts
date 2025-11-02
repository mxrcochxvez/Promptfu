#!/usr/bin/env tsx
/**
 * Backfill script to create communities for existing classes, units, and lessons
 * 
 * Run with: pnpm tsx scripts/backfill-communities.ts
 */

import { db } from '../src/db/index'
import { communities, classes, units, lessons } from '../src/db/schema'
import { eq } from 'drizzle-orm'

async function backfillCommunities() {
  console.log('Starting community backfill...\n')

  // 1. Create communities for classes that don't have them
  console.log('1. Checking classes...')
  const allClasses = await db.select().from(classes)
  let classesCreated = 0

  for (const classItem of allClasses) {
    const existingCommunity = await db
      .select()
      .from(communities)
      .where(eq(communities.classId, classItem.id))
      .limit(1)

    if (existingCommunity.length === 0) {
      await db.insert(communities).values({
        name: `${classItem.title} Community`,
        description: `Community discussion for ${classItem.title}`,
        type: 'class',
        classId: classItem.id,
      })
      classesCreated++
      console.log(`   ✓ Created community for class: ${classItem.title}`)
    } else {
      console.log(`   - Class already has community: ${classItem.title}`)
    }
  }

  console.log(`\n   Classes processed: ${classesCreated} new communities created\n`)

  // 2. Create communities for units that don't have them
  console.log('2. Checking units...')
  const allUnits = await db.select().from(units)
  let unitsCreated = 0

  for (const unit of allUnits) {
    const existingCommunity = await db
      .select()
      .from(communities)
      .where(eq(communities.unitId, unit.id))
      .limit(1)

    if (existingCommunity.length === 0) {
      await db.insert(communities).values({
        name: `${unit.title} Community`,
        description: `Community discussion for ${unit.title}`,
        type: 'unit',
        unitId: unit.id,
        classId: unit.classId,
      })
      unitsCreated++
      console.log(`   ✓ Created community for unit: ${unit.title}`)
    } else {
      console.log(`   - Unit already has community: ${unit.title}`)
    }
  }

  console.log(`\n   Units processed: ${unitsCreated} new communities created\n`)

  // 3. Create communities for lessons that don't have them
  console.log('3. Checking lessons...')
  const allLessons = await db.select().from(lessons)
  let lessonsCreated = 0

  for (const lesson of allLessons) {
    const existingCommunity = await db
      .select()
      .from(communities)
      .where(eq(communities.lessonId, lesson.id))
      .limit(1)

    if (existingCommunity.length === 0) {
      // Get the unit to find the classId
      const unit = await db
        .select()
        .from(units)
        .where(eq(units.id, lesson.unitId))
        .limit(1)

      if (unit.length === 0) {
        console.log(`   ⚠ Lesson ${lesson.id} has invalid unitId: ${lesson.unitId}`)
        continue
      }

      await db.insert(communities).values({
        name: `${lesson.title} Community`,
        description: `Community discussion for ${lesson.title}`,
        type: 'lesson',
        lessonId: lesson.id,
        unitId: lesson.unitId,
        classId: unit[0].classId,
      })
      lessonsCreated++
      console.log(`   ✓ Created community for lesson: ${lesson.title}`)
    } else {
      console.log(`   - Lesson already has community: ${lesson.title}`)
    }
  }

  console.log(`\n   Lessons processed: ${lessonsCreated} new communities created\n`)

  // Summary
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('Backfill Summary:')
  console.log(`  Classes:  ${classesCreated} new communities`)
  console.log(`  Units:    ${unitsCreated} new communities`)
  console.log(`  Lessons:  ${lessonsCreated} new communities`)
  console.log(`  Total:    ${classesCreated + unitsCreated + lessonsCreated} new communities`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  console.log('✓ Backfill completed successfully!')
  
  process.exit(0)
}

// Run the script
backfillCommunities().catch((error) => {
  console.error('❌ Error during backfill:', error)
  process.exit(1)
})

