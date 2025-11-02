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
  communities,
  communityMembers,
  communityThreads,
  communityReplies,
  users,
  feedback,
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
  
  // Auto-create community for the class
  await db.insert(communities).values({
    name: `${data.title} Community`,
    description: `Community discussion for ${data.title}`,
    type: 'class',
    classId: newClass.id,
  })
  
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
  
  // Auto-create community for the unit
  await db.insert(communities).values({
    name: `${data.title} Community`,
    description: `Community discussion for ${data.title}`,
    type: 'unit',
    unitId: newUnit.id,
    classId: data.classId,
  })
  
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
  
  // Get unit to find classId
  const unit = await getUnitById(data.unitId)
  if (!unit) throw new Error('Unit not found')
  
  // Auto-create community for the lesson
  await db.insert(communities).values({
    name: `${data.title} Community`,
    description: `Community discussion for ${data.title}`,
    type: 'lesson',
    lessonId: newLesson.id,
    unitId: data.unitId,
    classId: unit.classId,
  })
  
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

// Community queries
export async function getCommunitiesByType(type: 'general' | 'class' | 'unit' | 'lesson', userId?: number) {
  let query = db.select().from(communities).where(eq(communities.type, type)).orderBy(desc(communities.createdAt))
  
  if (type === 'general' && userId) {
    // For general communities, only return ones user is enrolled in
    const userCommunities = await db
      .select({ communityId: communityMembers.communityId })
      .from(communityMembers)
      .where(eq(communityMembers.userId, userId))
    
    const communityIds = userCommunities.map((uc) => uc.communityId)
    if (communityIds.length > 0) {
      query = db.select().from(communities).where(and(eq(communities.type, type), inArray(communities.id, communityIds))).orderBy(desc(communities.createdAt))
    } else {
      return []
    }
  }
  
  return await query
}

export async function getCommunityById(communityId: number) {
  const result = await db.select().from(communities).where(eq(communities.id, communityId)).limit(1)
  return result[0] || null
}

export async function getCommunitiesForClass(classId: number) {
  // Get class community and all unit/lesson communities for this class
  return await db
    .select()
    .from(communities)
    .where(eq(communities.classId, classId))
    .orderBy(communities.type, desc(communities.createdAt))
}

export async function getCommunitiesForUnit(unitId: number) {
  // Get unit community and related lesson communities
  return await db
    .select()
    .from(communities)
    .where(eq(communities.unitId, unitId))
    .orderBy(communities.type, desc(communities.createdAt))
}

export async function getCommunitiesForLesson(lessonId: number) {
  // Get lesson community
  return await db
    .select()
    .from(communities)
    .where(eq(communities.lessonId, lessonId))
    .limit(1)
}

export async function getUserAccessibleCommunities(userId: number) {
  // Get all communities user has access to:
  // 1. Class communities where user is enrolled in the class
  // 2. Unit/Lesson communities where user is enrolled in parent class
  // 3. General communities where user is enrolled
  
  // Get all class enrollments
  const userEnrollments = await db
    .select({ classId: enrollments.classId })
    .from(enrollments)
    .where(eq(enrollments.userId, userId))
  
  const enrolledClassIds = userEnrollments.map((e) => e.classId)
  
  // Get class communities
  let classCommunities: any[] = []
  if (enrolledClassIds.length > 0) {
    classCommunities = await db
      .select()
      .from(communities)
      .where(and(eq(communities.type, 'class'), inArray(communities.classId!, enrolledClassIds)))
  }
  
  // Get unit/lesson communities for enrolled classes
  let unitLessonCommunities: any[] = []
  if (enrolledClassIds.length > 0) {
    unitLessonCommunities = await db
      .select()
      .from(communities)
      .where(and(
        sql`${communities.type} IN ('unit', 'lesson')`,
        inArray(communities.classId!, enrolledClassIds)
      ))
  }
  
  // Get general communities user is enrolled in
  const generalMemberships = await db
    .select({ communityId: communityMembers.communityId })
    .from(communityMembers)
    .where(eq(communityMembers.userId, userId))
  
  const generalCommunityIds = generalMemberships.map((gm) => gm.communityId)
  let generalCommunities: any[] = []
  if (generalCommunityIds.length > 0) {
    generalCommunities = await db
      .select()
      .from(communities)
      .where(and(eq(communities.type, 'general'), inArray(communities.id, generalCommunityIds)))
  }
  
  return [...classCommunities, ...unitLessonCommunities, ...generalCommunities]
}

export async function isUserInCommunity(userId: number, communityId: number) {
  const community = await getCommunityById(communityId)
  if (!community) return false
  
  // Check if it's a class/unit/lesson community - user must be enrolled in the class
  if (community.type !== 'general' && community.classId) {
    return await isUserEnrolled(userId, community.classId)
  }
  
  // For general communities, check direct membership
  if (community.type === 'general') {
    const result = await db
      .select()
      .from(communityMembers)
      .where(and(
        eq(communityMembers.userId, userId),
        eq(communityMembers.communityId, communityId)
      ))
      .limit(1)
    return result.length > 0
  }
  
  return false
}

export async function enrollUserInCommunity(userId: number, communityId: number) {
  // Check if already enrolled
  const existing = await db
    .select()
    .from(communityMembers)
    .where(and(
      eq(communityMembers.userId, userId),
      eq(communityMembers.communityId, communityId)
    ))
    .limit(1)
  
  if (existing.length > 0) return existing[0]
  
  const [enrollment] = await db
    .insert(communityMembers)
    .values({
      userId,
      communityId,
    })
    .returning()
  
  return enrollment
}

export async function getCommunityThreads(communityId: number) {
  // Get all threads with authors
  const threadsWithAuthors = await db
    .select({
      thread: communityThreads,
      author: {
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
      },
    })
    .from(communityThreads)
    .innerJoin(users, eq(communityThreads.authorId, users.id))
    .where(eq(communityThreads.communityId, communityId))
    .orderBy(desc(communityThreads.createdAt))

  // Get reply counts for each thread
  const threadIds = threadsWithAuthors.map((t: any) => t.thread.id)
  const replyCounts: Record<number, number> = {}
  
  if (threadIds.length > 0) {
    const counts = await db
      .select({
        threadId: communityReplies.threadId,
        count: sql<number>`count(*)::int`,
      })
      .from(communityReplies)
      .where(inArray(communityReplies.threadId, threadIds))
      .groupBy(communityReplies.threadId)
    
    counts.forEach((c: any) => {
      replyCounts[c.threadId] = c.count
    })
  }

  // Add reply counts to threads
  return threadsWithAuthors.map((item: any) => ({
    ...item,
    replyCount: replyCounts[item.thread.id] || 0,
  }))
}

export async function getThreadById(threadId: number) {
  const result = await db
    .select({
      thread: communityThreads,
      author: {
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
      },
    })
    .from(communityThreads)
    .innerJoin(users, eq(communityThreads.authorId, users.id))
    .where(eq(communityThreads.id, threadId))
    .limit(1)
  
  return result[0] || null
}

export async function createThread(data: {
  communityId: number
  authorId: number
  title: string
  content: string
}) {
  const [newThread] = await db.insert(communityThreads).values(data).returning()
  return newThread
}

export async function getThreadReplies(threadId: number) {
  return await db
    .select({
      reply: communityReplies,
      author: {
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
      },
    })
    .from(communityReplies)
    .innerJoin(users, eq(communityReplies.authorId, users.id))
    .where(eq(communityReplies.threadId, threadId))
    .orderBy(communityReplies.createdAt)
}

export async function createReply(data: {
  threadId: number
  authorId: number
  content: string
}) {
  const [newReply] = await db.insert(communityReplies).values(data).returning()
  return newReply
}

export async function deleteThread(threadId: number) {
  await db.delete(communityThreads).where(eq(communityThreads.id, threadId))
}

export async function deleteReply(replyId: number) {
  await db.delete(communityReplies).where(eq(communityReplies.id, replyId))
}

export async function createGeneralCommunity(data: {
  name: string
  description?: string | null
}) {
  const [newCommunity] = await db
    .insert(communities)
    .values({
      name: data.name,
      description: data.description || null,
      type: 'general',
    })
    .returning()
  return newCommunity
}

// Feedback queries
export async function createFeedback(data: {
  userId: number
  feedbackType: 'bug' | 'coursework'
  sentiment: 'positive' | 'negative'
  content: string
  classId?: number | null
  unitId?: number | null
  lessonId?: number | null
}) {
  const [newFeedback] = await db
    .insert(feedback)
    .values({
      userId: data.userId,
      feedbackType: data.feedbackType,
      sentiment: data.sentiment,
      content: data.content,
      classId: data.classId || null,
      unitId: data.unitId || null,
      lessonId: data.lessonId || null,
    })
    .returning()
  return newFeedback
}

export async function getAllFeedback() {
  return await db
    .select({
      feedback: feedback,
      user: {
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
      },
      class: classes,
      unit: units,
      lesson: lessons,
    })
    .from(feedback)
    .innerJoin(users, eq(feedback.userId, users.id))
    .leftJoin(classes, eq(feedback.classId, classes.id))
    .leftJoin(units, eq(feedback.unitId, units.id))
    .leftJoin(lessons, eq(feedback.lessonId, lessons.id))
    .orderBy(desc(feedback.createdAt))
}

export async function getFeedbackByResource(data: {
  classId?: number
  unitId?: number
  lessonId?: number
}) {
  const conditions = []
  if (data.classId) {
    conditions.push(eq(feedback.classId, data.classId))
  }
  if (data.unitId) {
    conditions.push(eq(feedback.unitId, data.unitId))
  }
  if (data.lessonId) {
    conditions.push(eq(feedback.lessonId, data.lessonId))
  }

  if (conditions.length === 0) {
    return []
  }

  return await db
    .select({
      feedback: feedback,
      user: {
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
      },
      class: classes,
      unit: units,
      lesson: lessons,
    })
    .from(feedback)
    .innerJoin(users, eq(feedback.userId, users.id))
    .leftJoin(classes, eq(feedback.classId, classes.id))
    .leftJoin(units, eq(feedback.unitId, units.id))
    .leftJoin(lessons, eq(feedback.lessonId, lessons.id))
    .where(and(...conditions))
    .orderBy(desc(feedback.createdAt))
}

export async function getFeedbackStats() {
  // Get total counts by type and sentiment
  const stats = await db
    .select({
      feedbackType: feedback.feedbackType,
      sentiment: feedback.sentiment,
      count: sql<number>`count(*)::int`,
    })
    .from(feedback)
    .groupBy(feedback.feedbackType, feedback.sentiment)

  // Get counts by resource type
  const resourceStats = await db
    .select({
      resourceType: sql<string>`CASE 
        WHEN lesson_id IS NOT NULL THEN 'lesson'
        WHEN unit_id IS NOT NULL THEN 'unit'
        WHEN class_id IS NOT NULL THEN 'class'
        ELSE 'general'
      END`,
      count: sql<number>`count(*)::int`,
    })
    .from(feedback)
    .groupBy(sql`resourceType`)

  return {
    byTypeAndSentiment: stats,
    byResourceType: resourceStats,
    total: await db.select({ count: sql<number>`count(*)::int` }).from(feedback).then((r) => r[0]?.count || 0),
  }
}
