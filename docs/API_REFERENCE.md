# API Reference

Complete reference for all server functions (API endpoints) in Promptfu LMS.

## Table of Contents

- [Authentication APIs](#authentication-apis)
- [Class APIs](#class-apis)
- [Unit APIs](#unit-apis)
- [Lesson APIs](#lesson-apis)
- [Test APIs](#test-apis)
- [Progress APIs](#progress-apis)
- [Enrollment APIs](#enrollment-apis)
- [Community APIs](#community-apis)
- [Feedback APIs](#feedback-apis)
- [Usage Patterns](#usage-patterns)

## Authentication APIs

Location: `src/lib/api/auth.*.ts`

### Login

**Function**: `loginServerFn`  
**File**: `src/lib/api/auth.login.ts`

```typescript
const result = await loginServerFn({
  data: {
    email: string
    password: string
  }
})
```

**Response**:
```typescript
{
  success: boolean
  token?: string
  user?: User
  message?: string
}
```

### Signup

**Function**: `signupServerFn`  
**File**: `src/lib/api/auth.signup.ts`

```typescript
const result = await signupServerFn({
  data: {
    email: string
    password: string
    firstName?: string
    lastName?: string
  }
})
```

**Response**:
```typescript
{
  success: boolean
  token?: string
  user?: User
  message?: string
}
```

### Verify Token

**Function**: `verifyServerFn`  
**File**: `src/lib/api/auth.verify.ts`

```typescript
const result = await verifyServerFn({
  data: string // JWT token
})
```

**Response**:
```typescript
{
  success: boolean
  user?: User
  message?: string
}
```

### Logout

**Function**: `logoutServerFn`  
**File**: `src/lib/api/auth.logout.ts`

```typescript
await logoutServerFn()
```

**Note**: Primarily client-side cleanup. Server function exists for consistency.

## Class APIs

Most class APIs are defined inline in route files. Pattern:

### Get Class by Slug

```typescript
const getClass = createServerFn({
  method: 'POST',
})
  .inputValidator((data: { slug: string }) => data)
  .handler(async ({ data }) => {
    return await getClassBySlug(data.slug)
  })
```

### Get Class by ID

```typescript
const getClass = createServerFn({
  method: 'POST',
})
  .inputValidator((data: { classId: number }) => data)
  .handler(async ({ data }) => {
    return await getClassById(data.classId)
  })
```

### Create Class (Admin)

**Middleware**: Requires admin authentication

```typescript
const createClass = createServerFn({
  method: 'POST',
})
  .middleware([adminMiddleware])
  .inputValidator((data: {
    title: string
    description?: string | null
    thumbnailUrl?: string | null
  }) => data)
  .handler(async ({ data }) => {
    return await createClassInDb(data)
  })
```

**Auto-creates**: Community for the class

### Update Class (Admin)

```typescript
const updateClass = createServerFn({
  method: 'POST',
})
  .middleware([adminMiddleware])
  .inputValidator((data: {
    classId: number
    title?: string
    description?: string | null
    thumbnailUrl?: string | null
  }) => data)
  .handler(async ({ data }) => {
    const { classId, ...updateData } = data
    return await updateClassInDb(classId, updateData)
  })
```

**Note**: Regenerates slug if title changed

## Unit APIs

### Get Unit

```typescript
const getUnit = createServerFn({
  method: 'POST',
})
  .inputValidator((data: { unitId: number }) => data)
  .handler(async ({ data }) => {
    return await getUnitById(data.unitId)
  })
```

### Get Units by Class

```typescript
const getClassUnits = createServerFn({
  method: 'POST',
})
  .inputValidator((data: { classId: number }) => data)
  .handler(async ({ data }) => {
    return await getUnitsByClassId(data.classId)
  })
```

### Create Unit (Admin)

**Auto-creates**: Community for the unit

### Update Unit (Admin)

### Delete Unit (Admin)

## Lesson APIs

### Get Lesson

```typescript
const getLesson = createServerFn({
  method: 'POST',
})
  .inputValidator((data: { lessonId: number }) => data)
  .handler(async ({ data }) => {
    return await getLessonById(data.lessonId)
  })
```

### Get Lessons by Unit

```typescript
const getLessons = createServerFn({
  method: 'POST',
})
  .inputValidator((data: { unitId: number }) => data)
  .handler(async ({ data }) => {
    return await getLessonsByUnitId(data.unitId)
  })
```

### Create Lesson (Admin)

**Auto-creates**: Community for the lesson

### Mark Lesson Complete

```typescript
const completeLesson = createServerFn({
  method: 'POST',
})
  .inputValidator((data: {
    userId: number
    lessonId: number
  }) => data)
  .handler(async ({ data }) => {
    await markLessonComplete(data.userId, data.lessonId)
    // Auto-completes unit if all lessons done
    return { success: true }
  })
```

## Test APIs

### Get Test

```typescript
const getTest = createServerFn({
  method: 'POST',
})
  .inputValidator((data: { testId: number }) => data)
  .handler(async ({ data }) => {
    return await getTestWithQuestions(data.testId)
  })
```

### Get Tests by Class

```typescript
const getClassTests = createServerFn({
  method: 'POST',
})
  .inputValidator((data: { classId: number }) => data)
  .handler(async ({ data }) => {
    return await getTestsByClassId(data.classId)
  })
```

### Submit Test

```typescript
const submitTest = createServerFn({
  method: 'POST',
})
  .inputValidator((data: {
    userId: number
    testId: number
    answers: Array<{
      questionId: number
      answerText: string
    }>
  }) => data)
  .handler(async ({ data }) => {
    return await submitTestInDb(
      data.userId,
      data.testId,
      data.answers
    )
  })
```

**Response**:
```typescript
{
  submissionId: number
  score: number // Percentage
  earnedPoints: number
  totalPoints: number
}
```

## Progress APIs

### Get Unit Progress

```typescript
const getUnitProgress = createServerFn({
  method: 'POST',
})
  .inputValidator((data: {
    userId: number
    unitId: number
  }) => data)
  .handler(async ({ data }) => {
    return await getUnitCompletion(data.userId, data.unitId)
  })
```

**Returns**: Percentage (0-100)

### Get Class Progress

```typescript
const getClassProgress = createServerFn({
  method: 'POST',
})
  .inputValidator((data: {
    userId: number
    classId: number
  }) => data)
  .handler(async ({ data }) => {
    return await getClassCompletion(data.userId, data.classId)
  })
```

**Returns**: Percentage (0-100)

### Batch Progress (Optimized)

Use batch functions for multiple items:

```typescript
// Unit completions batch
const progressMap = await getUnitCompletionsBatch(userId, unitIds)
// Returns: { unitId: percentage, ... }

// Class completions batch
const progressMap = await getClassCompletionsBatch(userId, classIds)
// Returns: { classId: percentage, ... }
```

## Enrollment APIs

### Get User Enrollments

```typescript
const getEnrollments = createServerFn({
  method: 'POST',
})
  .inputValidator((data: number) => data) // userId
  .handler(async ({ data: userId }) => {
    const enrollments = await getUserEnrollments(userId)
    // Get completions batch
    const classIds = enrollments.map(e => e.class.id)
    const completions = await getClassCompletionsBatch(userId, classIds)
    
    return {
      classes: enrollments.map(e => ({
        ...e.class,
        progress: completions[e.class.id] || 0,
      }))
    }
  })
```

### Get Available Classes

```typescript
const getAvailable = createServerFn({
  method: 'POST',
})
  .inputValidator((data: number) => data) // userId
  .handler(async ({ data: userId }) => {
    const classes = await getAvailableClasses(userId)
    // Check content flags
    const classIds = classes.map(c => c.id)
    return await getClassesWithContentBatch(classIds)
  })
```

### Enroll in Class

```typescript
const enroll = createServerFn({
  method: 'POST',
})
  .inputValidator((data: {
    userId: number
    classId: number
  }) => data)
  .handler(async ({ data }) => {
    await enrollUserInClass(data.userId, data.classId)
    return { success: true }
  })
```

## Community APIs

### Get Communities

```typescript
const getCommunities = createServerFn({
  method: 'POST',
})
  .inputValidator((data: {
    type: 'general' | 'class' | 'unit' | 'lesson'
    userId?: number
  }) => data)
  .handler(async ({ data }) => {
    return await getCommunitiesByType(data.type, data.userId)
  })
```

### Get Community

```typescript
const getCommunity = createServerFn({
  method: 'POST',
})
  .inputValidator((data: { communityId: number }) => data)
  .handler(async ({ data }) => {
    return await getCommunityById(data.communityId)
  })
```

### Get Community Threads

```typescript
const getThreads = createServerFn({
  method: 'POST',
})
  .inputValidator((data: { communityId: number }) => data)
  .handler(async ({ data }) => {
    return await getCommunityThreads(data.communityId)
  })
```

**Response**: Threads with author info and reply counts

### Create Thread

```typescript
const createThread = createServerFn({
  method: 'POST',
})
  .inputValidator((data: {
    communityId: number
    authorId: number
    title: string
    content: string
  }) => data)
  .handler(async ({ data }) => {
    return await createThreadInDb(data)
  })
```

### Get Thread Replies

```typescript
const getReplies = createServerFn({
  method: 'POST',
})
  .inputValidator((data: { threadId: number }) => data)
  .handler(async ({ data }) => {
    return await getThreadReplies(data.threadId)
  })
```

### Create Reply

```typescript
const createReply = createServerFn({
  method: 'POST',
})
  .inputValidator((data: {
    threadId: number
    authorId: number
    content: string
  }) => data)
  .handler(async ({ data }) => {
    return await createReplyInDb(data)
  })
```

## Feedback APIs

Location: `src/lib/api/feedback.ts`

### Submit Feedback

**Function**: `submitFeedback`

```typescript
const result = await submitFeedback({
  data: {
    token: string
    feedbackType: 'bug' | 'coursework'
    sentiment: 'positive' | 'negative'
    content: string
    classId?: number | null
    unitId?: number | null
    lessonId?: number | null
  }
})
```

**Response**:
```typescript
{
  success: boolean
  feedback?: Feedback
  message?: string
}
```

**Authentication**: Requires valid token

### Get All Feedback (Admin)

**Function**: `getAllFeedbackFn`

```typescript
const result = await getAllFeedbackFn({
  data: {
    token: string
  }
})
```

**Response**:
```typescript
{
  success: boolean
  feedback?: Array<FeedbackWithRelations>
  message?: string
}
```

**Authentication**: Requires admin token

### Get Feedback by Resource (Admin)

**Function**: `getFeedbackFn`

```typescript
const result = await getFeedbackFn({
  data: {
    token: string
    classId?: number
    unitId?: number
    lessonId?: number
  }
})
```

**Authentication**: Requires admin token

### Get Feedback Stats (Admin)

**Function**: `getFeedbackStatsFn`

```typescript
const result = await getFeedbackStatsFn({
  data: {
    token: string
  }
})
```

**Response**:
```typescript
{
  success: boolean
  stats?: {
    byTypeAndSentiment: Array<{ feedbackType, sentiment, count }>
    byResourceType: Array<{ resourceType, count }>
    total: number
  }
  message?: string
}
```

**Authentication**: Requires admin token

## Usage Patterns

### With TanStack Query

```typescript
import { useQuery } from '@tanstack/react-query'
import { loginServerFn } from '../lib/api/auth.login'

function LoginComponent() {
  const { mutate } = useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      const result = await loginServerFn({ data })
      if (!result.success) {
        throw new Error(result.message)
      }
      return result
    },
  })

  // Use mutate()
}
```

### Error Handling

Always check `success` flag:

```typescript
const result = await someServerFn({ data })
if (!result.success) {
  console.error(result.message)
  return
}
// Use result.data
```

### Authentication

Most APIs require authentication. Pass token or use middleware:

```typescript
// Via token in input
const result = await apiFunction({
  data: {
    token: localStorage.getItem('auth_token'),
    // ... other data
  }
})

// Via middleware (route-level)
const protectedFn = createServerFn({
  method: 'POST',
})
  .middleware([adminMiddleware])
  .handler(async () => { /* ... */ })
```

## Related Documentation

- [Development Guide](./DEVELOPMENT_GUIDE.md) - How to use APIs
- [Authentication](./AUTHENTICATION.md) - Auth patterns
- [Database](./DATABASE.md) - Database queries used by APIs

