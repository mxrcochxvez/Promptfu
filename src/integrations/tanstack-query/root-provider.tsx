import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

export function getContext() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        // Data is considered fresh for 5 minutes
        staleTime: 5 * 60 * 1000, // 5 minutes
        // Cached data is kept for 10 minutes after becoming unused
        gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
        // Reduce unnecessary refetches
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        // Query deduplication is enabled by default in v5
        retry: 1,
      },
    },
  })
  return {
    queryClient,
  }
}

export function Provider({
  children,
  queryClient,
}: {
  children: React.ReactNode
  queryClient: QueryClient
}) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}
