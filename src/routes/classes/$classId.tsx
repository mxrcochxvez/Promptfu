import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { getClassById } from '../../db/queries'

const getClass = createServerFn({
  method: 'POST',
})
  .inputValidator((data: { classId: number }) => data)
  .handler(async ({ data }) => {
    return await getClassById(data.classId)
  })

export const Route = createFileRoute('/classes/$classId')({
  component: ClassRedirect,
})

function ClassRedirect() {
  const { classId } = Route.useParams()
  const navigate = useNavigate()
  const classIdNum = parseInt(classId)

  const { data: classData, isLoading } = useQuery({
    queryKey: ['classRedirect', classId],
    queryFn: async () => {
      if (isNaN(classIdNum)) return null
      return await getClass({ data: { classId: classIdNum } as any })
    },
    enabled: !isNaN(classIdNum),
  })

  useEffect(() => {
    if (classData && classData.slug) {
      // Redirect to slug-based URL
      navigate({
        to: '/classes/$slug',
        params: { slug: classData.slug },
        replace: true,
      })
    }
  }, [classData, navigate])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  if (!classData || !classData.slug) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white">Class not found</div>
      </div>
    )
  }

  // This will be replaced by the redirect, but show a message just in case
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
      <div className="text-white">Redirecting...</div>
    </div>
  )
}
