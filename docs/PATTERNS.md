# Code Patterns and Conventions

This document outlines common code patterns, conventions, and best practices used throughout the Promptfu LMS codebase.

## Table of Contents

- [Server Function Patterns](#server-function-patterns)
- [Database Query Patterns](#database-query-patterns)
- [Component Patterns](#component-patterns)
- [Authentication Patterns](#authentication-patterns)
- [Error Handling](#error-handling)
- [Batch Queries](#batch-queries)
- [Progress Tracking](#progress-tracking)
- [Slug Generation](#slug-generation)
- [Community Auto-Creation](#community-auto-creation)

## Server Function Patterns

### Standard Server Function

```typescript
import { createServerFn } from '@tanstack/react-start'
import { someQuery } from '../../db/queries'

const getData = createServerFn({
  method: 'POST',
})
  .inputValidator((data: { id: number }) => data)
  .handler(async ({ data }) => {
    return await someQuery(data.id)
  })

export { getData }
```

### With Error Handling

```typescript
const createItem = createServerFn({
  method: 'POST',
})
  .inputValidator((data: CreateItemData) => data)
  .handler(async ({ data }) => {
    try {
      const item = await createItemInDb(data)
      return { success: true, item }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create item',
      }
    }
  })
```

### With Authentication

```typescript
import { createServerFn, createMiddleware } from '@tanstack/react-start'
import { requireAdmin } from '../auth'

const adminMiddleware = createMiddleware().server(async ({ next, request }) => {
  requireAdmin(request)
  return next()
})

const adminFunction = createServerFn({
  method: 'POST',
})
  .middleware([adminMiddleware])
  .handler(async ({ data }) => {
    // Admin-only logic
  })
```

## Database Query Patterns

### Simple Select

```typescript
export async function getItemById(id: number) {
  const result = await db
    .select()
    .from(items)
    .where(eq(items.id, id))
    .limit(1)
  
  return result[0] || null
}
```

### With Joins

```typescript
export async function getItemWithUser(itemId: number) {
  const result = await db
    .select({
      item: items,
      user: {
        id: users.id,
        email: users.email,
      },
    })
    .from(items)
    .innerJoin(users, eq(items.userId, users.id))
    .where(eq(items.id, itemId))
    .limit(1)
  
  return result[0] || null
}
```

### Batch Queries (See Below)

Use batch queries for multiple items to avoid N+1 problems.

### Insert with Returning

```typescript
export async function createItem(data: CreateItemData) {
  const [newItem] = await db
    .insert(items)
    .values(data)
    .returning()
  
  return newItem
}
```

### Update Pattern

```typescript
export async function updateItem(itemId: number, data: UpdateItemData) {
  const [updated] = await db
    .update(items)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(items.id, itemId))
    .returning()
  
  return updated || null
}
```

### Delete Pattern

```typescript
export async function deleteItem(itemId: number) {
  await db
    .delete(items)
    .where(eq(items.id, itemId))
}
```

## Component Patterns

### Component with Query

```typescript
import { useQuery } from '@tanstack/react-query'

function ItemList() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['items'],
    queryFn: async () => {
      return await getItems()
    },
  })

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>

  return (
    <div>
      {data?.map(item => (
        <ItemCard key={item.id} item={item} />
      ))}
    </div>
  )
}
```

### Component with Mutation

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query'

function CreateItemForm() {
  const queryClient = useQueryClient()
  
  const { mutate, isPending } = useMutation({
    mutationFn: async (data: CreateItemData) => {
      const result = await createItem({ data })
      if (!result.success) {
        throw new Error(result.message)
      }
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] })
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    mutate({ title: 'New Item' })
  }

  return (
    <form onSubmit={handleSubmit}>
      <button type="submit" disabled={isPending}>
        {isPending ? 'Creating...' : 'Create'}
      </button>
    </form>
  )
}
```

### Protected Component

```typescript
import { useAuth } from '../contexts/AuthContext'

function ProtectedComponent() {
  const { user, isLoading } = useAuth()

  if (isLoading) return <div>Loading...</div>
  if (!user) return <div>Please login</div>

  return <div>Protected content</div>
}
```

## Authentication Patterns

### Protected Server Function

```typescript
const getProtectedData = createServerFn({
  method: 'POST',
})
  .handler(async ({ request }) => {
    const user = getUserFromRequest(request)
    if (!user) {
      throw new Error('Unauthorized')
    }
    return { data: 'Protected' }
  })
```

### Admin-Only Function

```typescript
const adminMiddleware = createMiddleware().server(async ({ next, request }) => {
  requireAdmin(request)
  return next()
})

const adminFunction = createServerFn({
  method: 'POST',
})
  .middleware([adminMiddleware])
  .handler(async () => {
    // Admin logic
  })
```

## Error Handling

### Server Function Error Pattern

Always return `{ success: boolean, ... }` structure:

```typescript
.handler(async ({ data }) => {
  try {
    const result = await operation(data)
    return { success: true, result }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Operation failed',
    }
  }
})
```

### Component Error Handling

```typescript
const { data, error } = useQuery({
  queryKey: ['data'],
  queryFn: async () => {
    const result = await getData()
    if (!result.success) {
      throw new Error(result.message)
    }
    return result.data
  },
})

if (error) {
  return <div>Error: {error.message}</div>
}
```

## Batch Queries

### Problem: N+1 Queries

```typescript
// ❌ Bad: N+1 query problem
for (const classId of classIds) {
  await getClassCompletion(userId, classId)
}
```

### Solution: Batch Query

```typescript
// ✅ Good: Single query for multiple items
export async function getClassCompletionsBatch(
  userId: number,
  classIds: number[]
): Promise<Record<number, number>> {
  if (classIds.length === 0) return {}

  // Fetch all related data in batch
  const allUnits = await db
    .select()
    .from(units)
    .where(inArray(units.classId, classIds))

  const allLessons = await db
    .select()
    .from(lessons)
    .where(inArray(lessons.unitId, allUnits.map(u => u.id)))

  // Calculate completions for all classes at once
  const completions: Record<number, number> = {}
  // ... calculation logic ...

  return completions
}
```

### Usage

```typescript
// Instead of multiple calls
const classIds = [1, 2, 3]
const completions = await getClassCompletionsBatch(userId, classIds)
// Returns: { 1: 75, 2: 100, 3: 50 }
```

## Progress Tracking

### Lesson Completion Pattern

```typescript
export async function markLessonComplete(userId: number, lessonId: number) {
  // Check if already completed
  const existing = await isLessonCompleted(userId, lessonId)
  if (existing) return null

  // Mark lesson complete
  await db.insert(lessonCompletions).values({ userId, lessonId })

  // Auto-complete unit if all lessons done
  const lesson = await getLessonById(lessonId)
  const unitLessons = await getLessonsByUnitId(lesson.unitId)
  const completedLessons = await getCompletedLessons(userId, lesson.unitId)

  if (completedLessons.length === unitLessons.length) {
    await markUnitComplete(userId, lesson.unitId)
  }
}
```

### Progress Calculation Pattern

```typescript
export async function getUnitCompletion(userId: number, unitId: number) {
  const unitLessons = await getLessonsByUnitId(unitId)
  
  if (unitLessons.length === 0) {
    // Legacy: check manual completion
    return (await isUnitCompleted(userId, unitId)) ? 100 : 0
  }

  const completedLessons = await getCompletedLessons(userId, unitId)
  return Math.round((completedLessons.length / unitLessons.length) * 100)
}
```

## Slug Generation

### Generate Slug Pattern

```typescript
import { generateSlug, ensureUniqueSlug } from '../lib/slug'

export async function createClass(data: CreateClassData) {
  // Generate base slug
  const baseSlug = generateSlug(data.title)
  
  // Ensure uniqueness
  const allClasses = await db.select({ slug: classes.slug }).from(classes)
  const existingSlugs = allClasses.map(c => c.slug).filter(Boolean) as string[]
  const uniqueSlug = ensureUniqueSlug(baseSlug, existingSlugs)
  
  // Create with unique slug
  const [newClass] = await db
    .insert(classes)
    .values({ ...data, slug: uniqueSlug })
    .returning()
  
  return newClass
}
```

### Update Slug Pattern

```typescript
export async function updateClass(classId: number, data: UpdateClassData) {
  const currentClass = await getClassById(classId)
  
  // Only regenerate slug if title changed
  let slug = currentClass.slug
  if (data.title !== currentClass.title) {
    const baseSlug = generateSlug(data.title)
    const allClasses = await db.select({ slug: classes.slug, id: classes.id }).from(classes)
    const existingSlugs = allClasses
      .filter(c => c.id !== classId)
      .map(c => c.slug)
      .filter(Boolean) as string[]
    slug = ensureUniqueSlug(baseSlug, existingSlugs)
  }
  
  await db.update(classes).set({ ...data, slug }).where(eq(classes.id, classId))
}
```

## Community Auto-Creation

### Pattern: Auto-Create Community

When creating class/unit/lesson, automatically create associated community:

```typescript
export async function createClass(data: CreateClassData) {
  const [newClass] = await db
    .insert(classes)
    .values(data)
    .returning()
  
  // Auto-create community
  await db.insert(communities).values({
    name: `${data.title} Community`,
    description: `Community discussion for ${data.title}`,
    type: 'class',
    classId: newClass.id,
  })
  
  return newClass
}
```

### Pattern: Unit Community

```typescript
export async function createUnit(data: CreateUnitData) {
  const [newUnit] = await db.insert(units).values(data).returning()
  
  await db.insert(communities).values({
    name: `${data.title} Community`,
    type: 'unit',
    unitId: newUnit.id,
    classId: data.classId,
  })
  
  return newUnit
}
```

## Styling Patterns

### Glass Effect Pattern

```typescript
<div className="glass-effect border border-neutral-800/50 rounded-xl p-5">
  {/* Content */}
</div>
```

### Card Pattern

```typescript
<div className="group block glass-effect border border-neutral-800/50 rounded-xl p-5 hover:border-olive-500/40 transition-all duration-300 hover:shadow-xl hover:shadow-olive-500/10 hover:-translate-y-1 card-shadow">
  {/* Card content */}
</div>
```

## TypeScript Patterns

### Type-Safe Server Function Input

```typescript
.inputValidator((data: {
  id: number
  title: string
  optional?: string
}) => data)
```

### Type-Safe Route Params

```typescript
const { id } = Route.useParams() // Type: { id: string }
const numericId = Number(id) // Convert if needed
```

## Naming Conventions

- **Components**: PascalCase (`ClassCard.tsx`)
- **Functions**: camelCase (`getClassById`)
- **Server Functions**: camelCase (`getClass`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_ITEMS`)
- **Database**: snake_case (mapped from camelCase)

## Related Documentation

- [Development Guide](./DEVELOPMENT_GUIDE.md) - Practical examples
- [Database](./DATABASE.md) - Database patterns
- [API Reference](./API_REFERENCE.md) - API patterns

