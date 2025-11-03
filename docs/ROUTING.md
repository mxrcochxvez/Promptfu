# Routing Guide

This guide covers the TanStack Router file-based routing system used in Promptfu LMS.

## Table of Contents

- [File-Based Routing](#file-based-routing)
- [Route Types](#route-types)
- [Dynamic Routes](#dynamic-routes)
- [Route Parameters](#route-parameters)
- [Protected Routes](#protected-routes)
- [Admin Routes](#admin-routes)
- [Nested Routes](#nested-routes)
- [Route Loaders](#route-loaders)
- [Navigation](#navigation)

## File-Based Routing

TanStack Router uses the file structure in `src/routes/` to automatically generate routes.

### Basic Example

```
src/routes/
├── index.tsx           → /
├── about.tsx          → /about
└── contact.tsx        → /contact
```

### Route File Structure

Each route file exports a `Route` object:

```typescript
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/about')({
  component: AboutPage,
})

function AboutPage() {
  return <div>About</div>
}
```

## Route Types

### Static Routes

Fixed path routes:

```typescript
// src/routes/dashboard.tsx → /dashboard
export const Route = createFileRoute('/dashboard')({
  component: Dashboard,
})
```

### Dynamic Routes

Routes with parameters use `$` prefix:

```typescript
// src/routes/users/$userId.tsx → /users/:userId
export const Route = createFileRoute('/users/$userId')({
  component: UserPage,
})

function UserPage() {
  const { userId } = Route.useParams()
  return <div>User {userId}</div>
}
```

### Index Routes

Default route for a path segment:

```typescript
// src/routes/admin/index.tsx → /admin (default)
// src/routes/admin/users.tsx → /admin/users
```

### Layout Routes

Wrap child routes using `__root.tsx` or folder structure:

```typescript
// src/routes/__root.tsx - Root layout
export const Route = createRootRouteWithContext()({
  component: RootLayout,
})

function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <Header />
        {children}
      </body>
    </html>
  )
}
```

## Dynamic Routes

### Single Parameter

```typescript
// src/routes/posts/$postId.tsx
export const Route = createFileRoute('/posts/$postId')({
  component: PostPage,
})

function PostPage() {
  const { postId } = Route.useParams()
  // postId is a string, convert if needed
  const id = Number(postId)
  return <div>Post {id}</div>
}
```

### Multiple Parameters

```typescript
// src/routes/users/$userId/posts/$postId.tsx
export const Route = createFileRoute('/users/$userId/posts/$postId')({
  component: UserPostPage,
})

function UserPostPage() {
  const { userId, postId } = Route.useParams()
  return <div>User {userId}, Post {postId}</div>
}
```

### Optional Parameters

Use `$` with optional syntax (TanStack Router handles this automatically in some cases):

```typescript
// Optional via route structure
// routes/posts/$postId/edit.tsx → /posts/:postId/edit
// routes/posts/$postId.tsx → /posts/:postId
```

## Route Parameters

### Accessing Parameters

```typescript
const { paramName } = Route.useParams()
```

### Query Parameters

```typescript
import { useSearch } from '@tanstack/react-router'

function SearchPage() {
  const search = useSearch({ from: '/search' })
  // URL: /search?q=hello → search.q = "hello"
  return <div>Search: {search.q}</div>
}
```

### Hash Parameters

```typescript
const location = useLocation()
const hash = location.hash // #section
```

## Protected Routes

### Client-Side Protection

Check authentication in component:

```typescript
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from '@tanstack/react-router'

export const Route = createFileRoute('/protected')({
  component: ProtectedPage,
})

function ProtectedPage() {
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

### Server-Side Protection

Use middleware with server functions:

```typescript
import { createServerFn, createMiddleware } from '@tanstack/react-start'
import { requireAdmin } from '../lib/auth'

const adminMiddleware = createMiddleware().server(async ({ next, request }) => {
  requireAdmin(request)
  return next()
})

const getProtectedData = createServerFn({
  method: 'POST',
})
  .middleware([adminMiddleware])
  .handler(async () => {
    return { data: 'Protected' }
  })
```

## Admin Routes

All admin routes follow this pattern:

1. **File location**: `src/routes/admin/...`
2. **Server middleware**: `requireAdmin(request)`
3. **Client check**: `user?.isAdmin`

### Example Admin Route

```typescript
// src/routes/admin/settings.tsx
import { createFileRoute } from '@tanstack/react-router'
import { createServerFn, createMiddleware } from '@tanstack/react-start'
import { requireAdmin } from '../../lib/auth'
import { useAuth } from '../../contexts/AuthContext'

const adminMiddleware = createMiddleware().server(async ({ next, request }) => {
  requireAdmin(request)
  return next()
})

const getSettings = createServerFn({
  method: 'GET',
})
  .middleware([adminMiddleware])
  .handler(async () => {
    return await getAdminSettings()
  })

export const Route = createFileRoute('/admin/settings')({
  component: AdminSettingsPage,
})

function AdminSettingsPage() {
  const { user } = useAuth()
  
  // Client-side check
  if (!user?.isAdmin) {
    navigate({ to: '/dashboard' })
    return null
  }

  const { data } = useQuery({
    queryKey: ['adminSettings'],
    queryFn: async () => await getSettings(),
  })

  return <div>{data}</div>
}
```

## Nested Routes

### Folder-Based Nesting

```
routes/
├── classes/
│   ├── $slug.tsx           → /classes/:slug
│   └── $slug/
│       ├── units/
│       │   └── $unitId.tsx → /classes/:slug/units/:unitId
│       └── tests/
│           └── $testId.tsx → /classes/:slug/tests/:testId
```

### Using Outlet for Nested Layouts

```typescript
// src/routes/classes/$slug.tsx
import { Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/classes/$slug')({
  component: ClassLayout,
})

function ClassLayout() {
  return (
    <div>
      <ClassHeader />
      <Outlet /> {/* Child routes render here */}
    </div>
  )
}
```

### Accessing Parent Route Data

```typescript
// Child route can access parent params
function UnitPage() {
  const { slug, unitId } = Route.useParams()
  // slug from parent, unitId from current route
  return <div>Class: {slug}, Unit: {unitId}</div>
}
```

## Route Loaders

Loaders run on server during SSR:

```typescript
export const Route = createFileRoute('/posts/$postId')({
  loader: async ({ params }) => {
    const post = await getPostById(Number(params.postId))
    return { post }
  },
  component: PostPage,
})

function PostPage() {
  const { post } = Route.useLoaderData()
  return <div>{post.title}</div>
}
```

**Note**: Most routes use TanStack Query with server functions instead for flexibility.

## Navigation

### Using Link Component

```typescript
import { Link } from '@tanstack/react-router'

<Link to="/about">About</Link>
<Link to="/users/$userId" params={{ userId: "123" }}>
  User 123
</Link>
```

### Programmatic Navigation

```typescript
import { useNavigate } from '@tanstack/react-router'

function MyComponent() {
  const navigate = useNavigate()

  const handleClick = () => {
    navigate({ to: '/dashboard' })
  }

  return <button onClick={handleClick}>Go to Dashboard</button>
}
```

### Navigation with State

```typescript
navigate({
  to: '/dashboard',
  state: { from: 'login' }
})

// Access in destination route
const location = useLocation()
const from = location.state?.from
```

### Prefetching

TanStack Router prefetches routes on hover:

```typescript
<Link
  to="/about"
  preload="intent" // Prefetch on hover
>
  About
</Link>
```

## Current Route Patterns in Codebase

### Class Routes

- **By ID**: `/classes/$classId` (legacy)
- **By Slug**: `/classes/$slug` (preferred)

### Admin Routes

- `/admin/classes` - Class management
- `/admin/users` - User management
- `/admin/feedback` - Feedback management

### Community Routes

- `/communities` - List communities
- `/communities/$communityId` - Community detail
- `/communities/$communityId/threads/$threadId` - Thread detail

## Route Generation

Routes are automatically generated from file structure. The route tree is generated in `src/routeTree.gen.ts` (do not edit manually).

Run type generation if routes don't work:
```bash
# Usually automatic, but can regenerate
pnpm dev
```

## Best Practices

1. **Use slugs for public routes** - `/classes/intro-to-ai` vs `/classes/123`
2. **Protect routes server-side** - Always verify auth on server
3. **Use TypeScript** - Type-safe route params and search params
4. **Keep routes organized** - Follow existing folder structure
5. **Use Outlet for layouts** - Nested routes render in Outlet

## Related Documentation

- [Development Guide](./DEVELOPMENT_GUIDE.md) - How to add routes
- [Authentication](./AUTHENTICATION.md) - Protected routes
- [Architecture](./ARCHITECTURE.md) - Routing architecture
- [Project Structure](./PROJECT_STRUCTURE.md) - File organization

