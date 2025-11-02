import { createFileRoute, Outlet, useLocation } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import CommunityCard from '../components/CommunityCard'
import { MessageSquare, Users } from 'lucide-react'
import { getUserAccessibleCommunities } from '../db/queries'

const getUserCommunities = createServerFn({
  method: 'POST',
})
  .inputValidator((data: number) => data)
  .handler(async ({ data }) => {
    if (!data) return { communities: [] }
    const communities = await getUserAccessibleCommunities(data)
    return { communities }
  })

export const Route = createFileRoute('/communities')({
  component: Communities,
})

function Communities() {
  const { user, isLoading } = useAuth()
  const location = useLocation()

  // Check if we're on a child route (community detail)
  const isChildRoute = location.pathname !== '/communities' && location.pathname.startsWith('/communities/')

  const { data: communitiesData, isLoading: communitiesLoading } = useQuery({
    queryKey: ['userCommunities', user?.id],
    queryFn: async () => {
      if (!user?.id) return { communities: [] }
      return await getUserCommunities({ data: user.id })
    },
    enabled: !!user?.id && !isLoading,
  })

  const communities = communitiesData?.communities || []

  // Separate communities by type
  const generalCommunities = communities.filter((c: any) => c.type === 'general')
  const classCommunities = communities.filter((c: any) => c.type === 'class')
  const unitCommunities = communities.filter((c: any) => c.type === 'unit')
  const lessonCommunities = communities.filter((c: any) => c.type === 'lesson')

  // If we're on a child route, render the outlet
  if (isChildRoute) {
    return <Outlet />
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-olive-400 mx-auto mb-4"></div>
          <p className="text-white">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-xl mb-4">Please sign in to view communities</p>
          <p className="text-gray-400 text-sm">You will be redirected automatically...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Communities</h1>
          <p className="text-gray-400">
            Connect with other learners and discuss topics
          </p>
        </div>

        {communitiesLoading ? (
          <div className="text-gray-400">Loading communities...</div>
        ) : communities.length === 0 ? (
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 text-center">
            <MessageSquare className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg mb-2">No communities available</p>
            <p className="text-gray-500 text-sm">
              Enroll in a class to access class communities
            </p>
          </div>
        ) : (
          <>
            {generalCommunities.length > 0 && (
              <div className="mb-12">
                <div className="flex items-center gap-2 mb-6">
                  <Users className="w-6 h-6 text-olive-400" />
                  <h2 className="text-2xl font-semibold text-white">General Communities</h2>
                  <span className="text-gray-400">({generalCommunities.length})</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {generalCommunities.map((community: any) => (
                    <CommunityCard
                      key={community.id}
                      communityId={community.id}
                      name={community.name}
                      description={community.description}
                      type={community.type}
                    />
                  ))}
                </div>
              </div>
            )}

            {classCommunities.length > 0 && (
              <div className="mb-12">
                <div className="flex items-center gap-2 mb-6">
                  <MessageSquare className="w-6 h-6 text-olive-400" />
                  <h2 className="text-2xl font-semibold text-white">Class Communities</h2>
                  <span className="text-gray-400">({classCommunities.length})</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {classCommunities.map((community: any) => (
                    <CommunityCard
                      key={community.id}
                      communityId={community.id}
                      name={community.name}
                      description={community.description}
                      type={community.type}
                    />
                  ))}
                </div>
              </div>
            )}

            {unitCommunities.length > 0 && (
              <div className="mb-12">
                <div className="flex items-center gap-2 mb-6">
                  <MessageSquare className="w-6 h-6 text-olive-400" />
                  <h2 className="text-2xl font-semibold text-white">Unit Communities</h2>
                  <span className="text-gray-400">({unitCommunities.length})</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {unitCommunities.map((community: any) => (
                    <CommunityCard
                      key={community.id}
                      communityId={community.id}
                      name={community.name}
                      description={community.description}
                      type={community.type}
                    />
                  ))}
                </div>
              </div>
            )}

            {lessonCommunities.length > 0 && (
              <div className="mb-12">
                <div className="flex items-center gap-2 mb-6">
                  <MessageSquare className="w-6 h-6 text-olive-400" />
                  <h2 className="text-2xl font-semibold text-white">Lesson Communities</h2>
                  <span className="text-gray-400">({lessonCommunities.length})</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {lessonCommunities.map((community: any) => (
                    <CommunityCard
                      key={community.id}
                      communityId={community.id}
                      name={community.name}
                      description={community.description}
                      type={community.type}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

