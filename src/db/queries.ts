import { eq, and, desc, sql, count, notInArray, inArray } from 'drizzle-orm'
import { db } from './index'
import {
  classes,
  units,
  lessons,
  tests,
  testQuestions,
  enrollments,
  testSubmissions,
  testAnswers,
  lessonCompletions,
  unitCompletions,
} from './schema'

// Class queries
export async function getAllClasses() {
  return await db.select().from(classes).orderBy(desc(classes.createdAt))
}

export async function getClassById(classId: number) {
  const result = await db.select().from(classes).where(eq(classes.id, classId)).limit(1)
  return result[0] || null
}

// Unit queries
export async function getUnitsByClassId(classId: number) {
  return await db
    .select()
    .from(units)
    .where(eq(units.classId, classId))
    .orderBy(units.orderIndex)
}

export async function getUnitById(unitId: number) {
  const result = await db.select().from(units).where(eq(units.id, unitId)).limit(1)
  return result[0] || null
}

// Lesson queries
export async function getLessonsByUnitId(unitId: number) {
  return await db
    .select()
    .from(lessons)
    .where(eq(lessons.unitId, unitId))
    .orderBy(lessons.orderIndex)
}

export async function getLessonById(lessonId: number) {
  const result = await db.select().from(lessons).where(eq(lessons.id, lessonId)).limit(1)
  return result[0] || null
}

// Test queries
export async function getTestsByClassId(classId: number) {
  return await db
    .select()
    .from(tests)
    .where(eq(tests.classId, classId))
    .orderBy(tests.createdAt)
}

export async function getTestById(testId: number) {
  const result = await db.select().from(tests).where(eq(tests.id, testId)).limit(1)
  return result[0] || null
}

export async function getTestWithQuestions(testId: number) {
  const test = await getTestById(testId)
  if (!test) return null

  const questions = await db
    .select()
    .from(testQuestions)
    .where(eq(testQuestions.testId, testId))
    .orderBy(testQuestions.orderIndex)

  return { ...test, questions }
}

// Enrollment queries
export async function getUserEnrollments(userId: number) {
  return await db
    .select({
      enrollment: enrollments,
      class: classes,
    })
    .from(enrollments)
    .innerJoin(classes, eq(enrollments.classId, classes.id))
    .where(eq(enrollments.userId, userId))
}

export async function isUserEnrolled(userId: number, classId: number) {
  const result = await db
    .select()
    .from(enrollments)
    .where(and(eq(enrollments.userId, userId), eq(enrollments.classId, classId)))
    .limit(1)
  return result.length > 0
}

export async function enrollUserInClass(userId: number, classId: number) {
  return await db.insert(enrollments).values({
    userId,
    classId,
  })
}

export async function unenrollUserFromClass(userId: number, classId: number) {
  return await db
    .delete(enrollments)
    .where(and(eq(enrollments.userId, userId), eq(enrollments.classId, classId)))
}

export async function getAvailableClasses(userId: number) {
  const enrolledClassIds = await db
    .select({ classId: enrollments.classId })
    .from(enrollments)
    .where(eq(enrollments.userId, userId))

  const enrolledIds = enrolledClassIds.map((e) => e.classId)
  
  if (enrolledIds.length === 0) {
    return await getAllClasses()
  }

  return await db
    .select()
    .from(classes)
    .where(notInArray(classes.id, enrolledIds))
    .orderBy(desc(classes.createdAt))
}

// Get all classes publicly (no auth required) with content check
export async function getAllClassesWithContentCheck() {
  const allClasses = await db.select().from(classes).orderBy(desc(classes.createdAt))
  
  // Get unit and test counts for each class to determine if coming soon
  const classesWithContent = await Promise.all(
    allClasses.map(async (classItem) => {
      const units = await getUnitsByClassId(classItem.id)
      const tests = await getTestsByClassId(classItem.id)
      return {
        ...classItem,
        hasContent: units.length > 0 || tests.length > 0,
      }
    })
  )
  
  return classesWithContent
}

// Lesson completion queries
export async function isLessonCompleted(userId: number, lessonId: number) {
  const result = await db
    .select()
    .from(lessonCompletions)
    .where(and(eq(lessonCompletions.userId, userId), eq(lessonCompletions.lessonId, lessonId)))
    .limit(1)
  return result.length > 0
}

export async function markLessonComplete(userId: number, lessonId: number) {
  const existing = await isLessonCompleted(userId, lessonId)
  if (existing) return null

  const completion = await db.insert(lessonCompletions).values({
    userId,
    lessonId,
  }).returning()

  // Auto-complete unit if all lessons are completed
  const lesson = await getLessonById(lessonId)
  if (lesson) {
    const unitLessons = await getLessonsByUnitId(lesson.unitId)
    const lessonIds = unitLessons.map((l) => l.id)
    const completedLessons = await db
      .select()
      .from(lessonCompletions)
      .where(
        and(
          eq(lessonCompletions.userId, userId),
          inArray(lessonCompletions.lessonId, lessonIds)
        )
      )

    if (completedLessons.length === unitLessons.length && unitLessons.length > 0) {
      // All lessons completed, mark unit as complete
      await markUnitComplete(userId, lesson.unitId)
    }
  }

  return completion[0]
}

export async function getCompletedLessons(userId: number, unitId: number) {
  const unitLessons = await getLessonsByUnitId(unitId)
  const lessonIds = unitLessons.map((l) => l.id)

  if (lessonIds.length === 0) return []

  return await db
    .select()
    .from(lessonCompletions)
    .where(
      and(
        eq(lessonCompletions.userId, userId),
        inArray(lessonCompletions.lessonId, lessonIds)
      )
    )
}

// Calculate unit completion percentage based on lessons
export async function getUnitCompletion(userId: number, unitId: number) {
  const unitLessons = await getLessonsByUnitId(unitId)
  
  if (unitLessons.length === 0) {
    // If no lessons, check if unit was manually completed (legacy)
    return (await isUnitCompleted(userId, unitId)) ? 100 : 0
  }

  const completedLessons = await getCompletedLessons(userId, unitId)
  return Math.round((completedLessons.length / unitLessons.length) * 100)
}

// Completion queries
export async function getCompletedUnits(userId: number, classId: number) {
  const classUnits = await getUnitsByClassId(classId)
  const unitIds = classUnits.map((u) => u.id)

  if (unitIds.length === 0) return []

  return await db
    .select()
    .from(unitCompletions)
    .where(
      and(
        eq(unitCompletions.userId, userId),
        inArray(unitCompletions.unitId, unitIds)
      )
    )
}

export async function isUnitCompleted(userId: number, unitId: number) {
  const result = await db
    .select()
    .from(unitCompletions)
    .where(and(eq(unitCompletions.userId, userId), eq(unitCompletions.unitId, unitId)))
    .limit(1)
  return result.length > 0
}

export async function markUnitComplete(userId: number, unitId: number) {
  const existing = await isUnitCompleted(userId, unitId)
  if (existing) return null

  return await db.insert(unitCompletions).values({
    userId,
    unitId,
  })
}

export async function getTestSubmissions(userId: number, testId: number) {
  return await db
    .select()
    .from(testSubmissions)
    .where(and(eq(testSubmissions.userId, userId), eq(testSubmissions.testId, testId)))
    .orderBy(desc(testSubmissions.submittedAt))
}

export async function hasCompletedTest(userId: number, testId: number) {
  const result = await getTestSubmissions(userId, testId)
  return result.length > 0
}

// Calculate class completion percentage based on unit progress
export async function getClassCompletion(userId: number, classId: number) {
  const classUnits = await getUnitsByClassId(classId)
  const classTests = await getTestsByClassId(classId)

  // Calculate average unit completion percentage
  let totalUnitProgress = 0
  for (const unit of classUnits) {
    totalUnitProgress += await getUnitCompletion(userId, unit.id)
  }

  // Calculate test completion (tests count as 100% if completed, 0% if not)
  let totalTestProgress = 0
  for (const test of classTests) {
    const completed = await hasCompletedTest(userId, test.id)
    totalTestProgress += completed ? 100 : 0
  }

  const totalItems = classUnits.length + classTests.length
  if (totalItems === 0) return 0

  const totalProgress = totalUnitProgress + totalTestProgress
  return Math.round(totalProgress / totalItems)
}

// Test submission
export async function submitTest(
  userId: number,
  testId: number,
  answers: { questionId: number; answerText: string }[]
) {
  const test = await getTestWithQuestions(testId)
  if (!test) throw new Error('Test not found')

  let totalPoints = 0
  let earnedPoints = 0
  const answersToInsert: Array<{
    submissionId: number
    questionId: number
    answerText: string
    isCorrect: boolean
  }> = []

  // Create submission first
  const [submission] = await db
    .insert(testSubmissions)
    .values({
      userId,
      testId,
    })
    .returning()

  // Check each answer
  for (const userAnswer of answers) {
    const question = test.questions.find((q) => q.id === userAnswer.questionId)
    if (!question) continue

    totalPoints += question.points
    let isCorrect = false

    if (question.questionType === 'multiple_choice') {
      isCorrect = userAnswer.answerText.trim() === question.correctAnswer.trim()
    } else if (question.questionType === 'true_false') {
      isCorrect = userAnswer.answerText.toLowerCase() === question.correctAnswer.toLowerCase()
    } else if (question.questionType === 'short_answer') {
      // For short answers, do case-insensitive comparison
      isCorrect =
        userAnswer.answerText.trim().toLowerCase() ===
        question.correctAnswer.trim().toLowerCase()
    }

    if (isCorrect) {
      earnedPoints += question.points
    }

    answersToInsert.push({
      submissionId: submission.id,
      questionId: userAnswer.questionId,
      answerText: userAnswer.answerText,
      isCorrect,
    })
  }

  const score = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0

  // Update submission with score
  await db
    .update(testSubmissions)
    .set({ score: score.toString() })
    .where(eq(testSubmissions.id, submission.id))

  // Insert all answers
  if (answersToInsert.length > 0) {
    await db.insert(testAnswers).values(answersToInsert)
  }

  return { ...submission, score, earnedPoints, totalPoints }
}

// Admin functions
export async function createClass(data: {
  title: string
  description?: string | null
  thumbnailUrl?: string | null
}) {
  const [newClass] = await db
    .insert(classes)
    .values({
      title: data.title,
      description: data.description || null,
      thumbnailUrl: data.thumbnailUrl || null,
    })
    .returning()
  return newClass
}

export async function updateClass(
  classId: number,
  data: {
    title: string
    description?: string | null
    thumbnailUrl?: string | null
  }
) {
  const [updated] = await db
    .update(classes)
    .set({
      title: data.title,
      description: data.description || null,
      thumbnailUrl: data.thumbnailUrl || null,
      updatedAt: new Date(),
    })
    .where(eq(classes.id, classId))
    .returning()
  return updated
}

export async function createUnit(data: {
  classId: number
  title: string
  orderIndex: number
  content: string
}) {
  const [newUnit] = await db.insert(units).values(data).returning()
  return newUnit
}

export async function updateUnit(
  unitId: number,
  data: {
    title?: string
    orderIndex?: number
    content?: string
  }
) {
  const [updated] = await db
    .update(units)
    .set(data)
    .where(eq(units.id, unitId))
    .returning()
  return updated
}

export async function deleteUnit(unitId: number) {
  await db.delete(units).where(eq(units.id, unitId))
}

export async function createLesson(data: {
  unitId: number
  title: string
  content: string
  orderIndex: number
}) {
  const [newLesson] = await db.insert(lessons).values(data).returning()
  return newLesson
}

export async function updateLesson(
  lessonId: number,
  data: {
    title?: string
    content?: string
    orderIndex?: number
  }
) {
  const [updated] = await db
    .update(lessons)
    .set(data)
    .where(eq(lessons.id, lessonId))
    .returning()
  return updated
}

export async function deleteLesson(lessonId: number) {
  await db.delete(lessons).where(eq(lessons.id, lessonId))
}

export async function createTest(data: {
  classId: number
  unitId?: number | null
  title: string
  description?: string | null
  passingScore?: string
}) {
  const [newTest] = await db.insert(tests).values(data).returning()
  return newTest
}

export async function updateTest(
  testId: number,
  data: {
    title?: string
    description?: string | null
    passingScore?: string
    unitId?: number | null
  }
) {
  const [updated] = await db
    .update(tests)
    .set(data)
    .where(eq(tests.id, testId))
    .returning()
  return updated
}

export async function deleteTest(testId: number) {
  await db.delete(tests).where(eq(tests.id, testId))
}

export async function createTestQuestion(data: {
  testId: number
  questionType: string
  questionText: string
  options?: string[] | null
  correctAnswer: string
  points: number
  orderIndex: number
}) {
  const [newQuestion] = await db
    .insert(testQuestions)
    .values({
      ...data,
      options: data.options ? JSON.stringify(data.options) : null,
    })
    .returning()
  return newQuestion
}

export async function updateTestQuestion(
  questionId: number,
  data: {
    questionType?: string
    questionText?: string
    options?: string[] | null
    correctAnswer?: string
    points?: number
    orderIndex?: number
  }
) {
  const updateData: any = { ...data }
  if (data.options !== undefined) {
    updateData.options = data.options ? JSON.stringify(data.options) : null
  }

  const [updated] = await db
    .update(testQuestions)
    .set(updateData)
    .where(eq(testQuestions.id, questionId))
    .returning()
  return updated
}

export async function deleteTestQuestion(questionId: number) {
  await db.delete(testQuestions).where(eq(testQuestions.id, questionId))
}
