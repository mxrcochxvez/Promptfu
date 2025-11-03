# Database Guide

Complete guide to the database schema, queries, and database operations in Promptfu LMS.

## Table of Contents

- [Schema Overview](#schema-overview)
- [Table Definitions](#table-definitions)
- [Relationships](#relationships)
- [Query Functions](#query-functions)
- [Migration Guide](#migration-guide)
- [Query Patterns](#query-patterns)
- [Performance Optimization](#performance-optimization)

## Schema Overview

The database uses PostgreSQL with Drizzle ORM. Schema is defined in `src/db/schema.ts`.

### Database Connection

Connection is configured in `src/db/index.ts`:

```typescript
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './schema.ts'

const pool = new Pool({
  connectionString: process.env.VITE_DATABASE_URL,
})

export const db = drizzle(pool, { schema })
```

## Table Definitions

### Users Table

```typescript
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  firstName: text('first_name'),
  lastName: text('last_name'),
  isAdmin: boolean('is_admin').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  lastLogin: timestamp('last_login'),
})
```

**Relationships:**
- One-to-many: enrollments, test_submissions, lesson_completions, unit_completions
- Many-to-many: community_members

### Classes Table

```typescript
export const classes = pgTable('classes', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  thumbnailUrl: text('thumbnail_url'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})
```

**Relationships:**
- One-to-many: units, tests, enrollments, communities (type='class')

### Units Table

```typescript
export const units = pgTable('units', {
  id: serial('id').primaryKey(),
  classId: integer('class_id')
    .notNull()
    .references(() => classes.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  orderIndex: integer('order_index').notNull().default(0),
  content: text('content').notNull(), // Markdown/HTML
  createdAt: timestamp('created_at').defaultNow(),
})
```

**Relationships:**
- Many-to-one: classes
- One-to-many: lessons, communities (type='unit')

### Lessons Table

```typescript
export const lessons = pgTable('lessons', {
  id: serial('id').primaryKey(),
  unitId: integer('unit_id')
    .notNull()
    .references(() => units.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  content: text('content').notNull(), // Markdown/HTML
  orderIndex: integer('order_index').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow(),
})
```

**Relationships:**
- Many-to-one: units
- One-to-many: communities (type='lesson'), lesson_completions

### Tests Table

```typescript
export const tests = pgTable('tests', {
  id: serial('id').primaryKey(),
  classId: integer('class_id')
    .notNull()
    .references(() => classes.id, { onDelete: 'cascade' }),
  unitId: integer('unit_id').references(() => units.id, { onDelete: 'set null' }),
  title: text('title').notNull(),
  description: text('description'),
  passingScore: decimal('passing_score', { precision: 5, scale: 2 })
    .notNull()
    .default('70.00'),
  createdAt: timestamp('created_at').defaultNow(),
})
```

**Relationships:**
- Many-to-one: classes (required), units (optional)
- One-to-many: test_questions, test_submissions

### Test Questions Table

```typescript
export const testQuestions = pgTable('test_questions', {
  id: serial('id').primaryKey(),
  testId: integer('test_id')
    .notNull()
    .references(() => tests.id, { onDelete: 'cascade' }),
  questionType: text('question_type').notNull(), // 'multiple_choice', 'true_false', 'short_answer'
  questionText: text('question_text').notNull(),
  options: jsonb('options'), // JSON array for multiple choice
  correctAnswer: text('correct_answer').notNull(),
  points: integer('points').notNull().default(1),
  orderIndex: integer('order_index').notNull().default(0),
})
```

**Question Types:**
- `multiple_choice`: options array contains choices
- `true_false`: options null, correctAnswer is 'true' or 'false'
- `short_answer`: options null, correctAnswer is expected answer

### Enrollments Table

```typescript
export const enrollments = pgTable('enrollments', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  classId: integer('class_id')
    .notNull()
    .references(() => classes.id, { onDelete: 'cascade' }),
  enrolledAt: timestamp('enrolled_at').defaultNow(),
  completedAt: timestamp('completed_at'),
})
```

**Relationships:**
- Many-to-one: users, classes
- Represents user enrollment in a class

### Test Submissions Table

```typescript
export const testSubmissions = pgTable('test_submissions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  testId: integer('test_id')
    .notNull()
    .references(() => tests.id, { onDelete: 'cascade' }),
  submittedAt: timestamp('submitted_at').defaultNow(),
  score: decimal('score', { precision: 5, scale: 2 }),
})
```

### Test Answers Table

```typescript
export const testAnswers = pgTable('test_answers', {
  id: serial('id').primaryKey(),
  submissionId: integer('submission_id')
    .notNull()
    .references(() => testSubmissions.id, { onDelete: 'cascade' }),
  questionId: integer('question_id')
    .notNull()
    .references(() => testQuestions.id, { onDelete: 'cascade' }),
  answerText: text('answer_text').notNull(),
  isCorrect: boolean('is_correct').notNull().default(false),
})
```

### Completions Tables

**Lesson Completions:**
```typescript
export const lessonCompletions = pgTable('lesson_completions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  lessonId: integer('lesson_id')
    .notNull()
    .references(() => lessons.id, { onDelete: 'cascade' }),
  completedAt: timestamp('completed_at').defaultNow(),
})
```

**Unit Completions:**
```typescript
export const unitCompletions = pgTable('unit_completions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  unitId: integer('unit_id')
    .notNull()
    .references(() => units.id, { onDelete: 'cascade' }),
  completedAt: timestamp('completed_at').defaultNow(),
})
```

**Note:** Units can be completed manually (legacy) or automatically when all lessons are completed.

### Communities Table

```typescript
export const communities = pgTable('communities', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  type: text('type').notNull(), // 'general', 'class', 'unit', 'lesson'
  classId: integer('class_id').references(() => classes.id, { onDelete: 'cascade' }),
  unitId: integer('unit_id').references(() => units.id, { onDelete: 'cascade' }),
  lessonId: integer('lesson_id').references(() => lessons.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})
```

**Community Types:**
- `general`: Standalone communities (requires community_members entry)
- `class`: Auto-created for classes (access via class enrollment)
- `unit`: Auto-created for units (access via class enrollment)
- `lesson`: Auto-created for lessons (access via class enrollment)

### Community Members Table

```typescript
export const communityMembers = pgTable('community_members', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  communityId: integer('community_id')
    .notNull()
    .references(() => communities.id, { onDelete: 'cascade' }),
  enrolledAt: timestamp('enrolled_at').defaultNow(),
})
```

**Relationships:**
- Many-to-many: users ↔ communities (for 'general' type communities)

### Community Threads Table

```typescript
export const communityThreads = pgTable('community_threads', {
  id: serial('id').primaryKey(),
  communityId: integer('community_id')
    .notNull()
    .references(() => communities.id, { onDelete: 'cascade' }),
  authorId: integer('author_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})
```

### Community Replies Table

```typescript
export const communityReplies = pgTable('community_replies', {
  id: serial('id').primaryKey(),
  threadId: integer('thread_id')
    .notNull()
    .references(() => communityThreads.id, { onDelete: 'cascade' }),
  authorId: integer('author_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})
```

### Feedback Table

```typescript
export const feedback = pgTable('feedback', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  feedbackType: text('feedback_type').notNull(), // 'bug' or 'coursework'
  sentiment: text('sentiment').notNull(), // 'positive' or 'negative'
  content: text('content').notNull(),
  classId: integer('class_id').references(() => classes.id, { onDelete: 'cascade' }),
  unitId: integer('unit_id').references(() => units.id, { onDelete: 'cascade' }),
  lessonId: integer('lesson_id').references(() => lessons.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})
```

## Relationships

### Entity Relationship Diagram

```
users
  ├── enrollments → classes
  ├── test_submissions → tests
  ├── lesson_completions → lessons
  ├── unit_completions → units
  └── community_members → communities

classes
  ├── units
  ├── tests
  ├── enrollments
  └── communities (type='class')

units
  ├── lessons
  ├── tests (optional)
  └── communities (type='unit')

lessons
  └── communities (type='lesson')

tests
  ├── test_questions
  └── test_submissions

communities
  ├── community_members (for type='general')
  ├── community_threads
  └── references class/unit/lesson (for type='class'/'unit'/'lesson')

community_threads
  └── community_replies
```

## Query Functions

All query functions are in `src/db/queries.ts` and `src/db/auth-queries.ts`.

### Class Queries

- `getAllClasses()` - Get all classes
- `getClassById(id)` - Get class by ID
- `getClassBySlug(slug)` - Get class by slug
- `createClass(data)` - Create new class (auto-creates community)
- `updateClass(id, data)` - Update class (regenerates slug if title changed)

### Unit Queries

- `getUnitsByClassId(classId)` - Get all units for a class
- `getUnitById(unitId)` - Get unit by ID
- `createUnit(data)` - Create unit (auto-creates community)
- `updateUnit(unitId, data)` - Update unit
- `deleteUnit(unitId)` - Delete unit

### Lesson Queries

- `getLessonsByUnitId(unitId)` - Get all lessons for a unit
- `getLessonById(lessonId)` - Get lesson by ID
- `createLesson(data)` - Create lesson (auto-creates community)
- `updateLesson(lessonId, data)` - Update lesson
- `deleteLesson(lessonId)` - Delete lesson

### Progress Queries

- `getUnitCompletion(userId, unitId)` - Get unit completion percentage
- `getUnitCompletionsBatch(userId, unitIds)` - Batch unit progress
- `getClassCompletion(userId, classId)` - Get class completion percentage
- `getClassCompletionsBatch(userId, classIds)` - Batch class progress
- `markLessonComplete(userId, lessonId)` - Mark lesson complete (auto-completes unit if all lessons done)
- `markUnitComplete(userId, unitId)` - Mark unit complete

### Test Queries

- `getTestsByClassId(classId)` - Get all tests for a class
- `getTestById(testId)` - Get test by ID
- `getTestWithQuestions(testId)` - Get test with questions
- `submitTest(userId, testId, answers)` - Submit test and calculate score

### Enrollment Queries

- `getUserEnrollments(userId)` - Get user's enrolled classes
- `getAvailableClasses(userId)` - Get classes user is not enrolled in
- `isUserEnrolled(userId, classId)` - Check enrollment
- `enrollUserInClass(userId, classId)` - Enroll user
- `unenrollUserFromClass(userId, classId)` - Unenroll user

### Community Queries

- `getCommunitiesByType(type, userId?)` - Get communities by type
- `getCommunityById(communityId)` - Get community by ID
- `getCommunitiesForClass(classId)` - Get all communities for a class
- `getUserAccessibleCommunities(userId)` - Get communities user can access
- `isUserInCommunity(userId, communityId)` - Check access
- `enrollUserInCommunity(userId, communityId)` - Add user to community
- `getCommunityThreads(communityId)` - Get threads with reply counts
- `createThread(data)` - Create thread
- `getThreadReplies(threadId)` - Get replies for thread
- `createReply(data)` - Create reply

## Migration Guide

### Modifying Schema

1. **Update schema** in `src/db/schema.ts`
2. **Push changes**:
   ```bash
   pnpm db:push
   ```
3. **Or generate migration**:
   ```bash
   pnpm db:generate
   pnpm db:migrate
   ```

### Running Migrations

Migrations are in `db/migrations/`:

```bash
# Apply all migrations
pnpm db:migrate
```

### Existing Migrations

- `add-slug-to-classes.sql` - Added slug column to classes table

## Query Patterns

See [PATTERNS.md](./PATTERNS.md) for detailed query patterns including:
- Simple queries
- Joins
- Batch queries
- Insert/Update/Delete patterns

## Performance Optimization

### Batch Queries

Always use batch functions when loading multiple items:
- `getClassCompletionsBatch()` instead of multiple `getClassCompletion()` calls
- `getUnitCompletionsBatch()` instead of multiple `getUnitCompletion()` calls

### Indexes

Indexes are defined in `db/init.sql` for:
- Feedback table (user_id, class_id, unit_id, lesson_id, type, sentiment, created_at)

Consider adding indexes for:
- Frequently queried columns
- Foreign keys
- Search columns

## Related Documentation

- [Patterns](./PATTERNS.md) - Query patterns and examples
- [Development Guide](./DEVELOPMENT_GUIDE.md) - How to use queries
- [API Reference](./API_REFERENCE.md) - API endpoints using queries

