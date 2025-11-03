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
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-olive-500/30 border-t-olive-500 mx-auto mb-4"></div>
          <p className="text-neutral-300">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="text-center glass-effect rounded-2xl p-8 card-shadow">
          <p className="text-neutral-50 text-xl mb-4 font-semibold">Please sign in to view communities</p>
          <p className="text-neutral-400 text-sm">You will be redirected automatically...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-hero py-8 px-4 md:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-neutral-50 mb-2">Communities</h1>
          <p className="text-neutral-400 text-base md:text-lg">
            Connect with other learners and discuss topics
          </p>
        </div>

        {communitiesLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass-effect rounded-2xl overflow-hidden border border-neutral-800/50 card-shadow p-6">
                <div className="h-5 skeleton rounded mb-3"></div>
                <div className="h-4 skeleton rounded w-3/4"></div>
              </div>
            ))}
          </div>
        ) : communities.length === 0 ? (
          <div className="glass-effect border border-neutral-800/50 rounded-2xl p-12 md:p-16 text-center card-shadow">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-accent-500/10 rounded-full mb-6 border border-accent-500/20">
              <MessageSquare className="w-10 h-10 text-accent-400/60" />
            </div>
            <p className="text-neutral-50 text-xl mb-3 font-semibold">No communities available</p>
            <p className="text-neutral-400 text-sm max-w-md mx-auto">
              Enroll in a class to access class communities
            </p>
          </div>
        ) : (
          <>
            {generalCommunities.length > 0 && (
              <div className="mb-12">
                <div className="flex items-center gap-3 mb-8">
                  <div className="p-2 bg-olive-500/10 rounded-xl border border-olive-500/20">
                    <Users className="w-5 h-5 text-olive-400" />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold text-neutral-50">General Communities</h2>
                  <span className="px-3 py-1 bg-neutral-800/50 rounded-full text-neutral-400 text-sm font-medium">
                    {generalCommunities.length}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                <div className="flex items-center gap-3 mb-8">
                  <div className="p-2 bg-accent-500/10 rounded-xl border border-accent-500/20">
                    <MessageSquare className="w-5 h-5 text-accent-400" />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold text-neutral-50">Class Communities</h2>
                  <span className="px-3 py-1 bg-neutral-800/50 rounded-full text-neutral-400 text-sm font-medium">
                    {classCommunities.length}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                <div className="flex items-center gap-3 mb-8">
                  <div className="p-2 bg-olive-500/10 rounded-xl border border-olive-500/20">
                    <MessageSquare className="w-5 h-5 text-olive-400" />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold text-neutral-50">Unit Communities</h2>
                  <span className="px-3 py-1 bg-neutral-800/50 rounded-full text-neutral-400 text-sm font-medium">
                    {unitCommunities.length}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                <div className="flex items-center gap-3 mb-8">
                  <div className="p-2 bg-accent-500/10 rounded-xl border border-accent-500/20">
                    <MessageSquare className="w-5 h-5 text-accent-400" />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold text-neutral-50">Lesson Communities</h2>
                  <span className="px-3 py-1 bg-neutral-800/50 rounded-full text-neutral-400 text-sm font-medium">
                    {lessonCommunities.length}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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

