import { createServerFn } from '@tanstack/react-start'
import { verifyToken, requireAdminFromToken } from '../auth'
import {
  createFeedback,
  getAllFeedback,
  getFeedbackByResource,
  getFeedbackStats,
} from '../../db/queries'

const submitFeedback = createServerFn({
  method: 'POST',
})
  .inputValidator(
    (data: {
      token: string
      feedbackType: 'bug' | 'coursework'
      sentiment: 'positive' | 'negative'
      content: string
      classId?: number | null
      unitId?: number | null
      lessonId?: number | null
    }) => data
  )
  .handler(async ({ data }) => {
    try {
      // Verify user is authenticated
      const payload = verifyToken(data.token)
      if (!payload) {
        throw new Error('Unauthorized: Invalid or missing token')
      }

      // Create feedback
      const feedback = await createFeedback({
        userId: payload.userId,
        feedbackType: data.feedbackType,
        sentiment: data.sentiment,
        content: data.content,
        classId: data.classId || null,
        unitId: data.unitId || null,
        lessonId: data.lessonId || null,
      })

      return {
        success: true,
        feedback,
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to submit feedback',
      }
    }
  })

const getAllFeedbackFn = createServerFn({
  method: 'POST',
})
  .inputValidator((data: { token: string }) => data)
  .handler(async ({ data }) => {
    try {
      // Verify user is admin
      requireAdminFromToken(data.token)

      const feedback = await getAllFeedback()
      return {
        success: true,
        feedback,
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to retrieve feedback',
      }
    }
  })

const getFeedbackFn = createServerFn({
  method: 'POST',
})
  .inputValidator(
    (data: {
      token: string
      classId?: number
      unitId?: number
      lessonId?: number
    }) => data
  )
  .handler(async ({ data }) => {
    try {
      // Verify user is admin
      requireAdminFromToken(data.token)

      const feedback = await getFeedbackByResource({
        classId: data.classId,
        unitId: data.unitId,
        lessonId: data.lessonId,
      })

      return {
        success: true,
        feedback,
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to retrieve feedback',
      }
    }
  })

const getFeedbackStatsFn = createServerFn({
  method: 'POST',
})
  .inputValidator((data: { token: string }) => data)
  .handler(async ({ data }) => {
    try {
      // Verify user is admin
      requireAdminFromToken(data.token)

      const stats = await getFeedbackStats()
      return {
        success: true,
        stats,
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to retrieve feedback statistics',
      }
    }
  })

export { submitFeedback, getAllFeedbackFn, getFeedbackFn, getFeedbackStatsFn }

