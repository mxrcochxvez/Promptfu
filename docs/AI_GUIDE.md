# AI Guide

This guide helps AI agents understand how to work with the Promptfu LMS codebase effectively.

## Table of Contents

- [Quick Decision Trees](#quick-decision-trees)
- [Common Tasks](#common-tasks)
- [Where to Make Changes](#where-to-make-changes)
- [Code Patterns to Follow](#code-patterns-to-follow)
- [Important Conventions](#important-conventions)

## Quick Decision Trees

### Adding a New Feature

```
Is it a new page/route?
├─ YES → Add file in src/routes/
│   ├─ Static route? → filename.tsx
│   ├─ Dynamic route? → $param.tsx
│   └─ Needs auth? → Add auth check in component
│
├─ NO → Is it a new API endpoint?
│   ├─ YES → Create server function in src/lib/api/
│   │   ├─ Needs auth? → Add middleware or token check
│   │   ├─ Admin only? → Use requireAdmin middleware
│   │   └─ Needs DB query? → Add to src/db/queries.ts
│   │
│   └─ NO → Is it a new component?
│       ├─ YES → Add to src/components/
│       └─ NO → Is it a utility?
│           └─ YES → Add to src/lib/
```

### Adding a New Route

```
1. Create file in src/routes/
   ├─ Pattern: filename.tsx → /filename
   └─ Dynamic: $param.tsx → /:param

2. Export Route object:
   export const Route = createFileRoute('/path')({
     component: ComponentName,
   })

3. Add component function

4. Need data?
   ├─ Use server function pattern
   └─ Use TanStack Query with useQuery

5. Need auth?
   ├─ Check useAuth() hook
   └─ Add redirect if not authenticated
```

### Adding a Database Query

```
1. Check src/db/queries.ts for similar queries

2. Add function following pattern:
   export async function getSomething(id: number) {
     const result = await db
       .select()
       .from(table)
       .where(eq(table.id, id))
       .limit(1)
     return result[0] || null
   }

3. Multiple items?
   └─ Use batch query pattern (see PATTERNS.md)

4. Export function

5. Use in server function
```

### Adding Authentication

```
1. Client-side check needed?
   ├─ YES → Use useAuth() hook
   │   └─ Redirect if !user
   │
   └─ NO → Server-side check needed?
       ├─ YES → Use middleware
       │   └─ requireAdmin(request) for admin
       │
       └─ NO → Token-based?
           └─ Use verifyToken(token)
```

## Common Tasks

### Task: Add a New Route

**Steps**:
1. Create file in `src/routes/` following naming convention
2. Use `createFileRoute` from `@tanstack/react-router`
3. Add component function
4. Import and use necessary hooks/components
5. Add authentication if needed

**Example**:
```typescript
// src/routes/about.tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/about')({
  component: AboutPage,
})

function AboutPage() {
  return <div>About</div>
}
```

### Task: Create a Server Function

**Steps**:
1. Create file in `src/lib/api/` or define in route file
2. Use `createServerFn` from `@tanstack/react-start`
3. Add input validator for type safety
4. Add handler with business logic
5. Add middleware if auth required
6. Export function
7. Use in component with TanStack Query

**Example**:
```typescript
// src/lib/api/items.ts
import { createServerFn } from '@tanstack/react-start'
import { getItemById } from '../../db/queries'

const getItem = createServerFn({
  method: 'POST',
})
  .inputValidator((data: { id: number }) => data)
  .handler(async ({ data }) => {
    return await getItemById(data.id)
  })

export { getItem }
```

### Task: Add a Database Query

**Steps**:
1. Open `src/db/queries.ts`
2. Add function following existing patterns
3. Use Drizzle ORM syntax
4. Export function
5. Use in server function

**Example**:
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

### Task: Add Authentication to Route

**Steps**:
1. Import `useAuth` from contexts
2. Get user from hook
3. Check if authenticated
4. Redirect if not

**Example**:
```typescript
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from '@tanstack/react-router'

function ProtectedPage() {
  const { user, isLoading } = useAuth()
  const navigate = useNavigate()

  if (isLoading) return <div>Loading...</div>
  if (!user) {
    navigate({ to: '/login' })
    return null
  }

  return <div>Protected content</div>
}
```

### Task: Add Admin-Only Feature

**Steps**:
1. Add server-side middleware with `requireAdmin`
2. Add client-side check with `user?.isAdmin`
3. Redirect if not admin

**Example**:
```typescript
// Server-side
const adminMiddleware = createMiddleware().server(async ({ next, request }) => {
  requireAdmin(request)
  return next()
})

// Client-side
const { user } = useAuth()
if (!user?.isAdmin) {
  navigate({ to: '/dashboard' })
  return null
}
```

### Task: Update Database Schema

**Steps**:
1. Modify `src/db/schema.ts`
2. Add/update table definition
3. Run `pnpm db:push` to sync
4. Or generate migration: `pnpm db:generate`

**Example**:
```typescript
export const items = pgTable('items', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  // Add new column
  description: text('description'),
})
```

## Where to Make Changes

### File Locations Quick Reference

| Change Type | File Location | Pattern |
|------------|--------------|---------|
| New route | `src/routes/` | `filename.tsx` or `$param.tsx` |
| New component | `src/components/` | `ComponentName.tsx` |
| New API endpoint | `src/lib/api/` | `feature.ts` or `auth.*.ts` |
| New database query | `src/db/queries.ts` | Export async function |
| Auth query | `src/db/auth-queries.ts` | Export async function |
| Database schema | `src/db/schema.ts` | Drizzle table definition |
| Utility function | `src/lib/` | `utility.ts` |
| Auth utility | `src/lib/auth.ts` | Export function |
| Styling | `src/styles.css` | Global styles or Tailwind |

### Route Structure

```
routes/
├── Public routes (no auth)
│   ├── index.tsx
│   ├── login.tsx
│   └── signup.tsx
│
├── Protected routes (auth required)
│   ├── dashboard.tsx
│   └── classes/
│
└── Admin routes (admin required)
    └── admin/
```

### Component Organization

- **Reusable components**: `src/components/`
- **Route-specific components**: In route file or `components/`
- **Shared utilities**: `src/lib/`

## Code Patterns to Follow

### Server Function Pattern

Always follow this pattern:
```typescript
const functionName = createServerFn({
  method: 'POST',
})
  .inputValidator((data: Type) => data)
  .handler(async ({ data }) => {
    try {
      // Logic
      return { success: true, data }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed',
      }
    }
  })
```

### Database Query Pattern

```typescript
export async function getItem(id: number) {
  const result = await db
    .select()
    .from(items)
    .where(eq(items.id, id))
    .limit(1)
  return result[0] || null
}
```

### Component with Query Pattern

```typescript
function Component() {
  const { data, isLoading } = useQuery({
    queryKey: ['key'],
    queryFn: async () => await getData(),
  })

  if (isLoading) return <div>Loading...</div>
  if (!data) return <div>No data</div>

  return <div>{data}</div>
}
```

### Error Handling Pattern

Always return `{ success: boolean, ... }`:
```typescript
return {
  success: true,
  data: result,
}

// Or error
return {
  success: false,
  message: error.message,
}
```

## Important Conventions

### Naming

- **Components**: PascalCase (`ClassCard.tsx`)
- **Functions**: camelCase (`getClassById`)
- **Files**: Match export (component file = component name)
- **Routes**: kebab-case or dynamic (`about.tsx`, `$slug.tsx`)
- **Server functions**: camelCase (`getClass`)
- **Database**: snake_case (mapped from camelCase)

### Authentication

- **Always verify server-side** - Never trust client
- **Use middleware for routes** - `requireAdmin(request)`
- **Check client-side too** - Better UX
- **Token in localStorage + cookies** - For SSR support

### Database

- **Use batch queries** - Avoid N+1 problems
- **Always handle null** - Return `null` if not found
- **Use transactions** - For multi-step operations
- **Export queries** - From `queries.ts`

### Performance

- **Batch queries** - `getCompletionsBatch()` not loops
- **Cache with TanStack Query** - Automatic caching
- **Optimize images** - Use proper formats
- **Lazy load routes** - Automatic with TanStack Router

### Security

- **Hash passwords** - Always use bcrypt
- **Validate input** - Server-side validation
- **Sanitize output** - Prevent XSS
- **Use HTTPS** - In production
- **Protect secrets** - Environment variables

## Decision Points

### When to Create New File vs. Extend Existing

**Create new file if**:
- Feature is distinct
- File is getting large (>300 lines)
- Reusability needed elsewhere

**Extend existing if**:
- Related functionality
- Small addition (<50 lines)
- Logical grouping

### When to Use Batch Query

**Use batch when**:
- Loading multiple items of same type
- Performance is concern
- N+1 query problem exists

**Use individual when**:
- Single item needed
- Simple operation
- Batch adds complexity

### When to Use Middleware vs. Component Check

**Use middleware when**:
- Server-side protection critical
- Admin-only features
- API endpoints

**Use component check when**:
- Better UX needed
- Client-side redirects
- Loading states

## Common Mistakes to Avoid

1. **N+1 Queries**: Don't loop queries, use batch
2. **Missing Auth Checks**: Always verify server-side
3. **Type Errors**: Use TypeScript types consistently
4. **Error Handling**: Always return success/failure
5. **Slug Generation**: Use `ensureUniqueSlug()`
6. **Community Creation**: Auto-create when creating class/unit/lesson
7. **Progress Calculation**: Use batch functions

## Related Documentation

- [Development Guide](./DEVELOPMENT_GUIDE.md) - Detailed examples
- [Patterns](./PATTERNS.md) - Code patterns
- [API Reference](./API_REFERENCE.md) - API endpoints
- [Database](./DATABASE.md) - Database patterns
- [Architecture](./ARCHITECTURE.md) - System design

## Quick Reference

**Import paths**:
- Routes: `@tanstack/react-router`
- Server functions: `@tanstack/react-start`
- Queries: `@tanstack/react-query`
- Database: `../db/queries`
- Auth: `../lib/auth` or `../contexts/AuthContext`

**Common functions**:
- `getClassBySlug(slug)` - Get class
- `getUserEnrollments(userId)` - Get enrollments
- `markLessonComplete(userId, lessonId)` - Complete lesson
- `isUserEnrolled(userId, classId)` - Check enrollment
- `generateSlug(text)` - Generate slug
- `requireAdmin(request)` - Admin check

