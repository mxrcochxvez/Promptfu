import {
  pgTable,
  serial,
  text,
  timestamp,
  integer,
  boolean,
  jsonb,
  decimal,
} from 'drizzle-orm/pg-core'

// Users table
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

// Classes table
export const classes = pgTable('classes', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  thumbnailUrl: text('thumbnail_url'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

// Units table
export const units = pgTable('units', {
  id: serial('id').primaryKey(),
  classId: integer('class_id')
    .notNull()
    .references(() => classes.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  orderIndex: integer('order_index').notNull().default(0),
  content: text('content').notNull(), // Markdown/HTML content
  createdAt: timestamp('created_at').defaultNow(),
})

// Lessons table
export const lessons = pgTable('lessons', {
  id: serial('id').primaryKey(),
  unitId: integer('unit_id')
    .notNull()
    .references(() => units.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  content: text('content').notNull(), // Markdown/HTML content
  orderIndex: integer('order_index').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow(),
})

// Tests table
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

// Test questions table
export const testQuestions = pgTable('test_questions', {
  id: serial('id').primaryKey(),
  testId: integer('test_id')
    .notNull()
    .references(() => tests.id, { onDelete: 'cascade' }),
  questionType: text('question_type').notNull(), // 'multiple_choice', 'true_false', 'short_answer'
  questionText: text('question_text').notNull(),
  options: jsonb('options'), // JSON array for multiple choice options
  correctAnswer: text('correct_answer').notNull(),
  points: integer('points').notNull().default(1),
  orderIndex: integer('order_index').notNull().default(0),
})

// Enrollments table
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

// Test submissions table
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

// Test answers table
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

// Unit completions table
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

// Keep the todos table for now (can be removed later if not needed)
// Note: This table may have different columns in the database (description, is_completed)
// This schema matches what the application actually uses
export const todos = pgTable('todos', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
})
