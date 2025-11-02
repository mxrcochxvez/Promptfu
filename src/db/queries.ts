import { eq, and, desc, sql, count, notInArray, inArray } from 'drizzle-orm'
import { db } from './index'
import {
  classes,
  units,
  tests,
  testQuestions,
  enrollments,
  testSubmissions,
  testAnswers,
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

// Calculate class completion percentage
export async function getClassCompletion(userId: number, classId: number) {
  const classUnits = await getUnitsByClassId(classId)
  const classTests = await getTestsByClassId(classId)

  const totalItems = classUnits.length + classTests.length
  if (totalItems === 0) return 0

  const completedUnits = await getCompletedUnits(userId, classId)
  const completedUnitsCount = completedUnits.length

  let completedTestsCount = 0
  for (const test of classTests) {
    const completed = await hasCompletedTest(userId, test.id)
    if (completed) completedTestsCount++
  }

  const completedItems = completedUnitsCount + completedTestsCount
  return Math.round((completedItems / totalItems) * 100)
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
