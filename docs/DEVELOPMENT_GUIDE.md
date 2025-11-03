# Development Guide

This guide provides step-by-step instructions for common development tasks in the Promptfu LMS codebase.

## Table of Contents

- [Adding Routes](#adding-routes)
- [Creating Server Functions](#creating-server-functions)
- [Working with Database](#working-with-database)
- [Adding Components](#adding-components)
- [Implementing Authentication](#implementing-authentication)
- [Admin Features](#admin-features)
- [Progress Tracking](#progress-tracking)
- [Community Features](#community-features)
- [Error Handling](#error-handling)

## Adding Routes

### Basic Route

Create a new file in `src/routes/`:

```typescript
// src/routes/about.tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/about')({
  component: AboutPage,
})

function AboutPage() {
  return <div>About Page</div>
}
```

This creates a route at `/about`.

### Dynamic Route

Use `$` prefix for dynamic parameters:

```typescript
// src/routes/posts/$postId.tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/posts/$postId')({
  component: PostPage,
})

function PostPage() {
  const { postId } = Route.useParams()
  return <div>Post {postId}</div>
}
```

Access route params via `Route.useParams()`.

### Route with Data Loading

```typescript
// src/routes/posts/$postId.tsx
import { createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { useQuery } from '@tanstack/react-query'

const getPost = createServerFn({
  method: 'POST',
})
  .inputValidator((data: { postId: number }) => data)
  .handler(async ({ data }) => {
    return await getPostById(data.postId)
  })

export const Route = createFileRoute('/posts/$postId')({
  component: PostPage,
})

function PostPage() {
  const { postId } = Route.useParams()
  
  const { data: post, isLoading } = useQuery({
    queryKey: ['post', postId],
    queryFn: async () => {
      return await getPost({ data: { postId: Number(postId) } })
    },
  })

  if (isLoading) return <div>Loading...</div>
  if (!post) return <div>Post not found</div>

  return <div>{post.title}</div>
}
```

See [ROUTING.md](./ROUTING.md) for more routing patterns.

## Creating Server Functions

Server functions are type-safe API endpoints using `createServerFn`.

### Basic Server Function

```typescript
// src/lib/api/posts.ts
import { createServerFn } from '@tanstack/react-start'
import { getPostById } from '../../db/queries'

const getPost = createServerFn({
  method: 'POST',
})
  .inputValidator((data: { postId: number }) => data)
  .handler(async ({ data }) => {
    return await getPostById(data.postId)
  })

export { getPost }
```

### With Authentication

```typescript
import { createServerFn, createMiddleware } from '@tanstack/react-start'
import { requireAdmin } from '../auth'

const adminMiddleware = createMiddleware().server(async ({ next, request }) => {
  requireAdmin(request) // Throws if not admin
  return next()
})

const deletePost = createServerFn({
  method: 'POST',
})
  .middleware([adminMiddleware])
  .inputValidator((data: { postId: number }) => data)
  .handler(async ({ data }) => {
    await deletePostById(data.postId)
    return { success: true }
  })

export { deletePost }
```

### Error Handling Pattern

```typescript
const createPost = createServerFn({
  method: 'POST',
})
  .inputValidator((data: { title: string; content: string }) => data)
  .handler(async ({ data }) => {
    try {
      const post = await createPostInDb(data)
      return { success: true, post }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create post',
      }
    }
  })
```

### Using Server Function in Component

```typescript
import { useQuery, useMutation } from '@tanstack/react-query'
import { getPost, createPost } from '../lib/api/posts'

function PostComponent() {
  // Query (GET)
  const { data, isLoading } = useQuery({
    queryKey: ['posts'],
    queryFn: async () => {
      return await getPost({ data: { postId: 1 } })
    },
  })

  // Mutation (POST/PUT/DELETE)
  const { mutate } = useMutation({
    mutationFn: async (newPost: { title: string; content: string }) => {
      const result = await createPost({ data: newPost })
      if (!result.success) {
        throw new Error(result.message)
      }
      return result
    },
    onSuccess: () => {
      // Refetch or update cache
      queryClient.invalidateQueries({ queryKey: ['posts'] })
    },
  })

  return (
    <div>
      {isLoading ? 'Loading...' : <div>{data?.title}</div>}
      <button onClick={() => mutate({ title: 'New', content: 'Post' })}>
        Create Post
      </button>
    </div>
  )
}
```

See [API_REFERENCE.md](./API_REFERENCE.md) for more server function examples.

## Working with Database

### Adding a Query Function

Add to `src/db/queries.ts`:

```typescript
import { eq } from 'drizzle-orm'
import { db } from './index'
import { posts } from './schema'

export async function getPostById(postId: number) {
  const result = await db
    .select()
    .from(posts)
    .where(eq(posts.id, postId))
    .limit(1)
  
  return result[0] || null
}

export async function getAllPosts() {
  return await db
    .select()
    .from(posts)
    .orderBy(desc(posts.createdAt))
}
```

### Batch Queries (Performance Optimization)

Instead of multiple queries:

```typescript
// ❌ N+1 query problem
for (const postId of postIds) {
  await getPostById(postId)
}
```

Use batch queries:

```typescript
// ✅ Single query
export async function getPostsBatch(postIds: number[]) {
  if (postIds.length === 0) return []
  
  return await db
    .select()
    .from(posts)
    .where(inArray(posts.id, postIds))
}
```

### Complex Queries with Joins

```typescript
export async function getPostWithAuthor(postId: number) {
  const result = await db
    .select({
      post: posts,
      author: {
        id: users.id,
        email: users.email,
        firstName: users.firstName,
      },
    })
    .from(posts)
    .innerJoin(users, eq(posts.authorId, users.id))
    .where(eq(posts.id, postId))
    .limit(1)
  
  return result[0] || null
}
```

### Updating Schema

1. **Modify schema** in `src/db/schema.ts`:
   ```typescript
   export const posts = pgTable('posts', {
     id: serial('id').primaryKey(),
     title: text('title').notNull(),
     content: text('content').notNull(),
     // Add new column
     publishedAt: timestamp('published_at'),
   })
   ```

2. **Push to database**:
   ```bash
   pnpm db:push
   ```

3. **Or generate migration**:
   ```bash
   pnpm db:generate
   pnpm db:migrate
   ```

See [DATABASE.md](./DATABASE.md) for detailed database documentation.

## Adding Components

### Basic Component

```typescript
// src/components/PostCard.tsx
interface PostCardProps {
  title: string
  content: string
  author: string
}

export default function PostCard({ title, content, author }: PostCardProps) {
  return (
    <div className="glass-effect border border-neutral-800/50 rounded-xl p-5">
      <h3 className="text-xl font-bold text-neutral-50">{title}</h3>
      <p className="text-neutral-400 mt-2">{content}</p>
      <p className="text-sm text-neutral-500 mt-4">By {author}</p>
    </div>
  )
}
```

### Component with State

```typescript
import { useState } from 'react'

export default function PostCard({ post }: { post: Post }) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div>
      <h3>{post.title}</h3>
      {isExpanded && <p>{post.content}</p>}
      <button onClick={() => setIsExpanded(!isExpanded)}>
        {isExpanded ? 'Collapse' : 'Expand'}
      </button>
    </div>
  )
}
```

### Component Using TanStack Query

```typescript
import { useQuery } from '@tanstack/react-query'
import { getPost } from '../lib/api/posts'

export default function PostCard({ postId }: { postId: number }) {
  const { data: post, isLoading } = useQuery({
    queryKey: ['post', postId],
    queryFn: async () => {
      return await getPost({ data: { postId } })
    },
  })

  if (isLoading) return <div>Loading...</div>
  if (!post) return <div>Post not found</div>

  return <div>{post.title}</div>
}
```

## Implementing Authentication

### Protected Route (Client-Side)

```typescript
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from '@tanstack/react-router'

export default function ProtectedPage() {
  const { user, isLoading } = useAuth()
  const navigate = useNavigate()

  if (isLoading) return <div>Loading...</div>
  
  if (!user) {
    navigate({ to: '/login' })
    return null
  }

  return <div>Protected Content</div>
}
```

### Protected Server Function

```typescript
import { createServerFn } from '@tanstack/react-start'
import { getUserFromRequest } from '../auth'

const getProtectedData = createServerFn({
  method: 'POST',
})
  .handler(async ({ request }) => {
    const user = getUserFromRequest(request)
    if (!user) {
      throw new Error('Unauthorized')
    }
    
    // Access user.userId, user.email, etc.
    return { data: 'Protected data' }
  })
```

### Admin-Only Route

See [Admin Features](#admin-features) below.

See [AUTHENTICATION.md](./AUTHENTICATION.md) for complete auth documentation.

## Admin Features

### Admin Route with Middleware

```typescript
import { createFileRoute } from '@tanstack/react-router'
import { createServerFn, createMiddleware } from '@tanstack/react-start'
import { requireAdmin } from '../../lib/auth'

const adminMiddleware = createMiddleware().server(async ({ next, request }) => {
  requireAdmin(request) // Throws if not admin
  return next()
})

const getAdminData = createServerFn({
  method: 'GET',
})
  .middleware([adminMiddleware])
  .handler(async () => {
    return await getAdminOnlyData()
  })

export const Route = createFileRoute('/admin/data')({
  component: AdminPage,
})

function AdminPage() {
  const { user } = useAuth()
  
  // Client-side check (backup)
  if (!user?.isAdmin) {
    navigate({ to: '/dashboard' })
    return null
  }

  const { data } = useQuery({
    queryKey: ['adminData'],
    queryFn: async () => await getAdminData(),
  })

  return <div>{data}</div>
}
```

### Admin Route Pattern

All admin routes follow this pattern:
1. Server-side middleware with `requireAdmin()`
2. Client-side check with `user?.isAdmin`
3. Redirect if not admin

See `src/routes/admin/` for examples.

## Progress Tracking

### Marking Lesson Complete

```typescript
import { markLessonComplete } from '../db/queries'

const completeLesson = createServerFn({
  method: 'POST',
})
  .inputValidator((data: { userId: number; lessonId: number }) => data)
  .handler(async ({ data }) => {
    await markLessonComplete(data.userId, data.lessonId)
    // Automatically checks if unit should be completed
    return { success: true }
  })
```

### Getting Progress

```typescript
// Single unit progress
const progress = await getUnitCompletion(userId, unitId)

// Batch progress (multiple units at once)
const progressMap = await getUnitCompletionsBatch(userId, unitIds)
// Returns: { unitId: percentage, ... }
```

### Calculating Class Completion

```typescript
// Single class
const completion = await getClassCompletion(userId, classId)

// Batch (multiple classes)
const completions = await getClassCompletionsBatch(userId, classIds)
```

Progress is calculated based on:
- Lesson completions within units
- Unit completions within classes
- Test submissions

## Community Features

### Auto-Creating Communities

When creating classes, units, or lessons, communities are automatically created:

```typescript
// In queries.ts
export async function createClass(data: CreateClassData) {
  const newClass = await db.insert(classes).values(data).returning()
  
  // Auto-create community
  await db.insert(communities).values({
    name: `${data.title} Community`,
    type: 'class',
    classId: newClass[0].id,
  })
  
  return newClass[0]
}
```

### Checking Community Access

```typescript
// Check if user has access to community
const hasAccess = await isUserInCommunity(userId, communityId)

// Get user's accessible communities
const communities = await getUserAccessibleCommunities(userId)
```

### Creating Threads and Replies

```typescript
// Create thread
const thread = await createThread({
  communityId,
  authorId: user.id,
  title: 'Thread Title',
  content: 'Thread content',
})

// Create reply
const reply = await createReply({
  threadId,
  authorId: user.id,
  content: 'Reply content',
})
```

## Error Handling

### Server Function Errors

```typescript
const apiFunction = createServerFn({
  method: 'POST',
})
  .handler(async ({ data }) => {
    try {
      // Operation that might fail
      const result = await riskyOperation(data)
      return { success: true, result }
    } catch (error) {
      // Return error response
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Operation failed',
      }
    }
  })
```

### Component Error Handling

```typescript
const { data, error, isLoading } = useQuery({
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

### Mutation Error Handling

```typescript
const { mutate, error, isError } = useMutation({
  mutationFn: async (data) => {
    const result = await createData(data)
    if (!result.success) {
      throw new Error(result.message)
    }
    return result
  },
  onError: (error) => {
    // Handle error (show toast, etc.)
    console.error('Mutation failed:', error)
  },
})
```

## Best Practices

1. **Use TypeScript** - Type everything for safety
2. **Batch Queries** - Avoid N+1 query problems
3. **Error Handling** - Always handle errors gracefully
4. **Loading States** - Show loading indicators
5. **Optimistic Updates** - Update UI immediately when possible
6. **Cache Management** - Invalidate queries after mutations
7. **Security** - Always verify auth server-side
8. **Performance** - Use batch queries for multiple items

## Related Documentation

- [Routing](./ROUTING.md) - Detailed routing patterns
- [Authentication](./AUTHENTICATION.md) - Complete auth guide
- [Database](./DATABASE.md) - Database patterns
- [Patterns](./PATTERNS.md) - Code patterns and conventions
- [API Reference](./API_REFERENCE.md) - API documentation

