import {
  HeadContent,
  Scripts,
  createRootRouteWithContext,
} from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'

import Header from '../components/Header'

import { AuthProvider } from '../contexts/AuthContext'

import TanStackQueryDevtools from '../integrations/tanstack-query/devtools'

import appCss from '../styles.css?url'

import type { QueryClient } from '@tanstack/react-query'

interface MyRouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  head: () => {
    // Get base URL for absolute URLs in meta tags
    const getBaseUrl = () => {
      if (typeof window !== 'undefined') {
        return window.location.origin
      }
      // Fallback for SSR - can be set via environment variable
      return process.env.VITE_BASE_URL || 'https://promptfu.com'
    }

    const baseUrl = getBaseUrl()
    const siteName = 'Promptfu'
    const title = 'Promptfu - AI Learning Resources'
    const description = 'Your Online Learning Platform. Explore classes, learn at your own pace, and track your progress. Enroll in courses and start your learning journey today.'
    const imageUrl = `${baseUrl}/promptfu-logo.png`

    return {
      meta: [
        {
          charSet: 'utf-8',
        },
        {
          name: 'viewport',
          content: 'width=device-width, initial-scale=1',
        },
        {
          title,
        },
        {
          name: 'description',
          content: description,
        },
        {
          name: 'keywords',
          content: 'AI learning, online courses, education, learning platform, prompt engineering, AI resources',
        },
        {
          name: 'author',
          content: siteName,
        },
        // Open Graph tags
        {
          property: 'og:type',
          content: 'website',
        },
        {
          property: 'og:title',
          content: title,
        },
        {
          property: 'og:description',
          content: description,
        },
        {
          property: 'og:image',
          content: imageUrl,
        },
        {
          property: 'og:url',
          content: baseUrl,
        },
        {
          property: 'og:site_name',
          content: siteName,
        },
        // Twitter Card tags
        {
          name: 'twitter:card',
          content: 'summary_large_image',
        },
        {
          name: 'twitter:title',
          content: title,
        },
        {
          name: 'twitter:description',
          content: description,
        },
        {
          name: 'twitter:image',
          content: imageUrl,
        },
      ],
      links: [
        {
          rel: 'stylesheet',
          href: appCss,
        },
        {
          rel: 'canonical',
          href: baseUrl,
        },
      ],
    }
  },

  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  const isDevelopment = import.meta.env.DEV

  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <AuthProvider>
          <Header />
          {children}
          {isDevelopment && (
            <TanStackDevtools
              config={{
                position: 'bottom-right',
              }}
              plugins={[
                {
                  name: 'Tanstack Router',
                  render: <TanStackRouterDevtoolsPanel />,
                },
                TanStackQueryDevtools,
              ]}
            />
          )}
        </AuthProvider>
        <Scripts />
      </body>
    </html>
  )
}
