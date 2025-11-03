# Authentication Guide

Complete guide to the authentication system in Promptfu LMS.

## Table of Contents

- [Overview](#overview)
- [Authentication Flow](#authentication-flow)
- [JWT Tokens](#jwt-tokens)
- [AuthContext](#authcontext)
- [Protected Routes](#protected-routes)
- [Admin Routes](#admin-routes)
- [Server-Side Auth](#server-side-auth)
- [Token Storage](#token-storage)

## Overview

Promptfu uses JWT (JSON Web Tokens) for authentication:

- **Password Hashing**: bcrypt with salt rounds
- **Token Generation**: JWT with configurable expiration
- **Token Storage**: localStorage (client) + cookies (server)
- **Auth State**: React Context (AuthContext)

## Authentication Flow

### Signup Flow

```
User fills signup form
    ↓
Component calls AuthContext.signup()
    ↓
Calls signupServerFn (server function)
    ↓
Creates user in database (hashed password)
    ↓
Generates JWT token
    ↓
Returns token + user data
    ↓
Stores token in localStorage + cookie
    ↓
Updates AuthContext with user
    ↓
Redirects to /dashboard
```

### Login Flow

```
User fills login form
    ↓
Component calls AuthContext.login()
    ↓
Calls loginServerFn (server function)
    ↓
Verifies email + password
    ↓
Generates JWT token
    ↓
Returns token + user data
    ↓
Stores token in localStorage + cookie
    ↓
Updates AuthContext with user
    ↓
Redirects to /dashboard
```

### Logout Flow

```
User clicks logout
    ↓
Component calls AuthContext.logout()
    ↓
Calls logoutServerFn (optional cleanup)
    ↓
Removes token from localStorage
    ↓
Removes cookie
    ↓
Clears AuthContext
    ↓
Redirects to home
```

## JWT Tokens

### Token Structure

JWT payload contains:

```typescript
interface JWTPayload {
  userId: number
  email: string
  isAdmin: boolean
}
```

### Token Generation

```typescript
import { generateToken } from '../lib/auth'

const token = generateToken({
  userId: user.id,
  email: user.email,
  isAdmin: user.isAdmin,
})
```

### Token Verification

```typescript
import { verifyToken } from '../lib/auth'

const payload = verifyToken(token)
if (payload) {
  // Valid token
  const { userId, email, isAdmin } = payload
} else {
  // Invalid or expired token
}
```

### Token Expiration

Configured via `JWT_EXPIRES_IN` environment variable:
- Default: `7d` (7 days)
- Format: `1h`, `7d`, `30d`, etc.

## AuthContext

The `AuthContext` provides authentication state and methods to all components.

### Usage

```typescript
import { useAuth } from '../contexts/AuthContext'

function MyComponent() {
  const { user, isAuthenticated, isLoading, login, logout } = useAuth()

  if (isLoading) return <div>Loading...</div>
  
  if (!isAuthenticated) {
    return <div>Please login</div>
  }

  return (
    <div>
      <p>Welcome, {user?.email}</p>
      <button onClick={logout}>Logout</button>
    </div>
  )
}
```

### AuthContext API

```typescript
interface AuthContextType {
  user: User | null           // Current user or null
  isAuthenticated: boolean    // true if user exists
  isLoading: boolean          // true during initial check
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string, firstName?: string, lastName?: string) => Promise<void>
  logout: () => Promise<void>
}
```

### User Type

```typescript
interface User {
  id: number
  email: string
  firstName: string | null
  lastName: string | null
  isAdmin: boolean
  createdAt: Date | null
  updatedAt: Date | null
  lastLogin: Date | null
}
```

## Protected Routes

### Client-Side Protection

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

Protect server functions:

```typescript
import { createServerFn } from '@tanstack/react-start'
import { getUserFromRequest } from '../lib/auth'

const getProtectedData = createServerFn({
  method: 'POST',
})
  .handler(async ({ request }) => {
    const user = getUserFromRequest(request)
    if (!user) {
      throw new Error('Unauthorized')
    }
    
    // User is authenticated
    return { data: 'Protected data', userId: user.userId }
  })
```

## Admin Routes

Admin routes require `isAdmin: true` flag.

### Client-Side Admin Check

```typescript
import { useAuth } from '../contexts/AuthContext'

function AdminPage() {
  const { user } = useAuth()

  if (!user?.isAdmin) {
    navigate({ to: '/dashboard' })
    return null
  }

  return <div>Admin Content</div>
}
```

### Server-Side Admin Check

Use `requireAdmin()` function:

```typescript
import { createServerFn, createMiddleware } from '@tanstack/react-start'
import { requireAdmin } from '../lib/auth'

const adminMiddleware = createMiddleware().server(async ({ next, request }) => {
  requireAdmin(request) // Throws if not admin
  return next()
})

const getAdminData = createServerFn({
  method: 'POST',
})
  .middleware([adminMiddleware])
  .handler(async () => {
    return await getAdminOnlyData()
  })
```

### Alternative: Token-Based Admin Check

When Request object is not available:

```typescript
import { requireAdminFromToken } from '../lib/auth'

const getAdminData = createServerFn({
  method: 'POST',
})
  .inputValidator((data: { token: string }) => data)
  .handler(async ({ data }) => {
    const user = requireAdminFromToken(data.token)
    // User is verified as admin
    return await getAdminOnlyData()
  })
```

## Server-Side Auth

### Getting User from Request

```typescript
import { getUserFromRequest } from '../lib/auth'

const getData = createServerFn({
  method: 'POST',
})
  .handler(async ({ request }) => {
    const user = getUserFromRequest(request)
    
    if (!user) {
      return { error: 'Unauthorized' }
    }
    
    // Use user.userId, user.email, user.isAdmin
    return { data: 'User data' }
  })
```

### Extract Token from Header

```typescript
import { extractTokenFromHeader } from '../lib/auth'

const token = extractTokenFromHeader(request.headers.get('authorization'))
// Returns token string or null
```

### Verify Token Directly

```typescript
import { verifyToken } from '../lib/auth'

const payload = verifyToken(token)
if (payload) {
  const { userId, email, isAdmin } = payload
}
```

## Token Storage

### Client-Side Storage

Tokens are stored in:
- **localStorage**: `auth_token` key
- **Cookies**: `auth_token` cookie (for server access)

### Setting Token

```typescript
// In AuthContext after login/signup
localStorage.setItem('auth_token', token)
document.cookie = `auth_token=${token}; path=/; max-age=${60 * 60 * 24 * 7}` // 7 days
```

### Removing Token

```typescript
// In AuthContext on logout
localStorage.removeItem('auth_token')
document.cookie = 'auth_token=; path=/; max-age=0'
```

### Reading Token

```typescript
// Client-side
const token = localStorage.getItem('auth_token')

// Server-side (from cookie)
const cookies = request.headers.get('cookie')
const cookieMatch = cookies?.match(/auth_token=([^;]+)/)
const token = cookieMatch?.[1]
```

## Authentication Functions

### Password Hashing

```typescript
import { hashPassword, verifyPassword } from '../lib/auth'

// Hash password
const hash = await hashPassword('myPassword')

// Verify password
const isValid = await verifyPassword('myPassword', hash)
```

### Token Functions

All in `src/lib/auth.ts`:

- `generateToken(payload)` - Create JWT token
- `verifyToken(token)` - Verify and decode token
- `extractTokenFromHeader(header)` - Extract from Authorization header
- `getUserFromRequest(request)` - Get user from request (header or cookie)
- `requireAdmin(request)` - Require admin, throw if not
- `requireAdminFromToken(token)` - Require admin from token string

## User Management Queries

Authentication-related database queries in `src/db/auth-queries.ts`:

- `createUser(data)` - Create new user
- `authenticateUser(email, password)` - Verify credentials
- `getUserById(userId)` - Get user by ID
- `getUserByEmail(email)` - Get user by email
- `updateUser(userId, data)` - Update user
- `deleteUser(userId)` - Delete user
- `updateUserRole(userId, isAdmin)` - Update admin status

## Session Management

### Session Check on Mount

AuthContext automatically checks for existing session:

```typescript
useEffect(() => {
  checkSession()
}, [])

async function checkSession() {
  const token = localStorage.getItem('auth_token')
  if (!token) return
  
  // Verify with server
  const result = await verifyServerFn({ data: token })
  if (result.success) {
    setUser(result.user)
  } else {
    localStorage.removeItem('auth_token')
  }
}
```

### Token Refresh

Currently, tokens don't auto-refresh. When expired:
1. User must login again
2. `verifyToken()` returns null
3. User is logged out automatically

## Security Considerations

1. **Password Hashing**: Always use bcrypt (never store plaintext)
2. **Token Secrets**: Strong `JWT_SECRET` in production
3. **HTTPS**: Required in production (tokens in cookies)
4. **Token Expiration**: Reasonable expiration times
5. **Server Verification**: Always verify auth server-side
6. **Admin Checks**: Server-side verification required

## Error Handling

### Login Errors

```typescript
try {
  await login(email, password)
} catch (error) {
  // Handle error (show message, etc.)
  console.error('Login failed:', error.message)
}
```

### Token Verification Errors

```typescript
const payload = verifyToken(token)
if (!payload) {
  // Token invalid or expired
  // Redirect to login
}
```

### Server Function Errors

```typescript
const result = await loginServerFn({ data: { email, password } })
if (!result.success) {
  // Handle error
  throw new Error(result.message)
}
```

## Related Documentation

- [Development Guide](./DEVELOPMENT_GUIDE.md) - How to implement auth
- [API Reference](./API_REFERENCE.md) - Auth API endpoints
- [Routing](./ROUTING.md) - Protected routes
- [Architecture](./ARCHITECTURE.md) - Auth flow architecture

