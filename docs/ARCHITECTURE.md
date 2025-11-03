# Architecture Guide

This document provides a comprehensive overview of the Promptfu LMS architecture, design decisions, and how different parts of the system work together.

## Table of Contents

- [Tech Stack](#tech-stack)
- [Application Architecture](#application-architecture)
- [Data Flow](#data-flow)
- [Routing Architecture](#routing-architecture)
- [Authentication Flow](#authentication-flow)
- [Database Architecture](#database-architecture)
- [Code Organization](#code-organization)
- [SSR/SPA Hybrid Model](#ssrspa-hybrid-model)

## Tech Stack

### Core Framework
- **TanStack Start** - Full-stack React framework with SSR capabilities
- **React 19** - UI library
- **TypeScript** - Type safety throughout

### Routing & Navigation
- **TanStack Router** - File-based routing with type-safe navigation
- File structure determines routes automatically

### Data Management
- **TanStack Query** - Client-side data fetching and caching
- **Server Functions** (`createServerFn`) - Type-safe API endpoints
- **Drizzle ORM** - Type-safe database queries

### Database
- **PostgreSQL** - Primary database (via Neon serverless)
- **Drizzle Kit** - Database migrations and schema management

### Authentication
- **JWT (jsonwebtoken)** - Token-based authentication
- **bcryptjs** - Password hashing

### Styling
- **Tailwind CSS** - Utility-first CSS framework
- Custom gradient and glass-effect styling

### Deployment
- **Netlify** - Hosting platform with serverless functions
- **Vite** - Build tool and dev server

## Application Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Browser                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   React      │  │ TanStack     │  │ TanStack     │      │
│  │   Components │  │ Router       │  │ Query        │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└──────────────────────┬──────────────────────────────────────┘
                     │ HTTP Requests
                     │ (Server Functions)
┌─────────────────────▼──────────────────────────────────────┐
│              TanStack Start Server                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Server       │  │ Auth         │  │ Database     │      │
│  │ Functions    │  │ Middleware   │  │ Layer        │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└──────────────────────┬──────────────────────────────────────┘
                       │ SQL Queries
┌──────────────────────▼──────────────────────────────────────┐
│              PostgreSQL Database (Neon)                      │
│  - Users, Classes, Units, Lessons, Tests                    │
│  - Enrollments, Completions, Submissions                    │
│  - Communities, Threads, Replies                            │
│  - Feedback                                                 │
└─────────────────────────────────────────────────────────────┘
```

### Key Architectural Patterns

1. **File-Based Routing**
   - Routes are defined by file structure in `src/routes/`
   - Dynamic routes use `$` prefix (e.g., `$classId.tsx`)
   - Layout routes use `__root.tsx` and nested `<Outlet />` components

2. **Server Functions**
   - API endpoints are created using `createServerFn` from TanStack Start
   - Type-safe input validation and handlers
   - Automatic serialization of request/response data
   - Can use middleware for authentication

3. **Data Fetching Strategy**
   - **Server Functions** for type-safe API calls
   - **TanStack Query** for client-side caching and state management
   - **Route Loaders** (optional) for SSR data loading
   - Batch queries for performance optimization

4. **Authentication Pattern**
   - JWT tokens stored in localStorage (client) and cookies (server)
   - AuthContext provides user state to components
   - Middleware functions verify auth on server routes
   - Protected routes check auth status

## Data Flow

### Typical Request Flow

1. **User Action** → Component event handler
2. **Component** → Calls TanStack Query mutation/query
3. **TanStack Query** → Calls server function (`createServerFn`)
4. **Server Function** → Executes business logic
5. **Server Function** → Calls database queries (`db/queries.ts`)
6. **Database Query** → Uses Drizzle ORM to query PostgreSQL
7. **Response** → Flows back through the chain
8. **TanStack Query** → Updates cache and component state
9. **Component** → Re-renders with new data

### Example: Loading a Class

```
User navigates to /classes/intro-to-ai
    ↓
TanStack Router matches route from file: classes/$slug.tsx
    ↓
Component mounts, calls useQuery with server function
    ↓
Server function getClassBySlug() executes
    ↓
Database query: getClassBySlug(slug) from queries.ts
    ↓
Drizzle ORM executes SQL: SELECT * FROM classes WHERE slug = ?
    ↓
Response flows back: { id, title, slug, description, ... }
    ↓
TanStack Query caches result, component renders
```

### Batch Query Optimization

For performance, the application uses batch queries when loading multiple related items:

```typescript
// Instead of N queries:
for (const classId of classIds) {
  await getClassCompletion(userId, classId)
}

// Use one batch query:
await getClassCompletionsBatch(userId, classIds)
```

See [PATTERNS.md](./PATTERNS.md#batch-queries) for more details.

## Routing Architecture

### File-Based Routing System

Routes are automatically generated from the file structure:

```
src/routes/
├── __root.tsx              # Root layout (wraps all routes)
├── index.tsx               # / (home page)
├── login.tsx               # /login
├── signup.tsx              # /signup
├── dashboard.tsx           # /dashboard
├── classes/
│   ├── $slug.tsx           # /classes/:slug
│   └── $slug/
│       ├── units/
│       │   └── $unitId.tsx # /classes/:slug/units/:unitId
│       └── tests/
│           └── $testId.tsx # /classes/:slug/tests/:testId
└── admin/
    └── classes/
        ├── index.tsx        # /admin/classes
        └── create.tsx        # /admin/classes/create
```

### Route Types

1. **Static Routes** - Fixed paths (e.g., `/dashboard`, `/login`)
2. **Dynamic Routes** - Parameters in path (e.g., `/classes/$slug`)
3. **Layout Routes** - Wrap child routes (`__root.tsx`, nested layouts)
4. **Index Routes** - Default route for a path segment (`index.tsx`)

### Protected Routes

Routes can be protected using:
- **Client-side checks** - Using `useAuth()` hook in component
- **Server-side middleware** - Using `createMiddleware()` with `requireAdmin()`
- **Route guards** - Redirect logic in route components

See [ROUTING.md](./ROUTING.md) for detailed routing patterns.

## Authentication Flow

### Authentication Architecture

```
┌─────────────┐
│   Client    │
│  Component  │
└──────┬──────┘
       │ 1. User submits login
       ▼
┌─────────────────┐
│  AuthContext     │
│  (login method)  │
└──────┬───────────┘
       │ 2. Call server function
       ▼
┌─────────────────┐
│  auth.login.ts  │
│  (Server Fn)    │
└──────┬───────────┘
       │ 3. Verify credentials
       ▼
┌─────────────────┐
│  auth-queries.ts│
│  authenticateUser│
└──────┬───────────┘
       │ 4. Query database
       ▼
┌─────────────────┐
│  PostgreSQL     │
│  (users table)  │
└─────────────────┘
       │ 5. Return user + token
       ▼
┌─────────────────┐
│  Generate JWT   │
│  (lib/auth.ts)  │
└──────┬───────────┘
       │ 6. Store token
       ▼
┌─────────────────┐
│ localStorage +  │
│   cookies       │
└─────────────────┘
```

### Token Storage Strategy

- **localStorage** - Client-side token storage for API calls
- **Cookies** - Server-side token access for SSR
- **AuthContext** - React context provides user state globally

### Protected Route Pattern

```typescript
// Server-side protection
const adminMiddleware = createMiddleware().server(async ({ next, request }) => {
  requireAdmin(request) // Throws if not admin
  return next()
})

// Client-side protection
const { user } = useAuth()
if (!user || !user.isAdmin) {
  navigate({ to: '/dashboard' })
  return null
}
```

See [AUTHENTICATION.md](./AUTHENTICATION.md) for complete auth documentation.

## Database Architecture

### Schema Relationships

```
users
  ├── enrollments → classes (many-to-many)
  ├── test_submissions → tests
  ├── lesson_completions → lessons
  ├── unit_completions → units
  └── community_members → communities

classes
  ├── units → units.class_id
  ├── tests → tests.class_id
  └── communities (type='class')

units
  ├── lessons → lessons.unit_id
  └── communities (type='unit')

lessons
  └── communities (type='lesson')

tests
  └── test_questions → test_questions.test_id
      └── test_answers → test_answers.question_id
```

### Database Layer Structure

1. **Schema Definition** (`db/schema.ts`)
   - Drizzle table definitions
   - Type-safe column definitions
   - Relationships and constraints

2. **Query Functions** (`db/queries.ts`)
   - Reusable database operations
   - Batch query optimizations
   - Business logic (e.g., progress calculation)

3. **Auth Queries** (`db/auth-queries.ts`)
   - User authentication operations
   - User management (CRUD)

4. **Database Connection** (`db/index.ts`)
   - Drizzle setup with connection pool
   - Environment variable configuration

### Query Patterns

- **Simple Queries** - Direct Drizzle ORM queries
- **Batch Queries** - Optimized for loading multiple items
- **Joined Queries** - Using Drizzle's join operations
- **Aggregation Queries** - Using SQL functions for stats

See [DATABASE.md](./DATABASE.md) for complete database documentation.

## Code Organization

### Directory Structure Principles

1. **Feature-Based Organization** - Related code grouped together
2. **Separation of Concerns** - Clear boundaries between layers
3. **Type Safety** - TypeScript throughout
4. **Reusability** - Shared utilities and components

### Key Directories

```
src/
├── routes/          # File-based routes (pages)
├── components/      # Reusable React components
├── contexts/        # React contexts (AuthContext)
├── db/              # Database layer (schema, queries)
├── lib/             # Utilities and helpers
│   ├── api/         # Server function definitions
│   ├── auth.ts      # Authentication utilities
│   └── slug.ts      # Slug generation
├── integrations/    # Third-party integrations
└── styles.css       # Global styles
```

### Import Patterns

- **Relative imports** - Within same feature area
- **Absolute imports** - For shared utilities (via `vite-tsconfig-paths`)
- **Barrel exports** - Index files for cleaner imports

## SSR/SPA Hybrid Model

### Server-Side Rendering (SSR)

- Initial page load rendered on server
- SEO-friendly HTML generation
- Meta tags and Open Graph support
- Fast initial paint

### Single Page Application (SPA)

- Client-side navigation after initial load
- No full page reloads
- TanStack Query caching
- Smooth transitions

### How It Works

1. **Initial Request** → Server renders React components
2. **HTML Sent** → Browser receives fully rendered HTML
3. **Hydration** → React takes over on client
4. **Subsequent Navigation** → Client-side routing only
5. **Data Fetching** → Server functions called as needed

### Route Loaders (Optional)

Routes can define loaders for SSR data fetching:

```typescript
export const Route = createFileRoute('/example')({
  loader: async () => {
    // Runs on server during SSR
    return await fetchData()
  },
  component: ExampleComponent,
})
```

However, most routes use TanStack Query with server functions for flexibility.

## Performance Optimizations

### Database Level

- **Batch Queries** - Reduce N+1 query problems
- **Indexes** - On foreign keys and frequently queried columns
- **Connection Pooling** - Efficient database connections

### Application Level

- **TanStack Query Caching** - Reduces redundant API calls
- **Code Splitting** - Automatic via Vite/TanStack Start
- **Lazy Loading** - Components and routes loaded on demand

### Client Level

- **SSR** - Faster initial load
- **Optimistic Updates** - Immediate UI feedback
- **Prefetching** - TanStack Router prefetches on hover

## Security Considerations

1. **Password Hashing** - bcrypt with salt rounds
2. **JWT Tokens** - Signed with secret key
3. **SQL Injection Prevention** - Drizzle ORM parameterized queries
4. **CSRF Protection** - TanStack Start built-in protection
5. **Environment Variables** - Secrets stored securely
6. **Admin Access** - Server-side verification required

## Extension Points

When adding new features:

1. **New Route** → Add file to `src/routes/`
2. **New API** → Create server function in `src/lib/api/`
3. **New Query** → Add to `src/db/queries.ts`
4. **New Component** → Add to `src/components/`
5. **New Schema** → Update `src/db/schema.ts` and run migration

See [DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md) for detailed guides.

## Related Documentation

- [Getting Started](./GETTING_STARTED.md) - Setup and installation
- [Routing](./ROUTING.md) - Detailed routing patterns
- [Authentication](./AUTHENTICATION.md) - Auth system details
- [Database](./DATABASE.md) - Database schema and queries
- [Development Guide](./DEVELOPMENT_GUIDE.md) - How to add features

