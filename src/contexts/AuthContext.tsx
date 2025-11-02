import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useNavigate } from '@tanstack/react-router'

export interface User {
  id: number
  email: string
  firstName: string | null
  lastName: string | null
  isAdmin: boolean
  createdAt: Date | null
  updatedAt: Date | null
  lastLogin: Date | null
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string, firstName?: string, lastName?: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()

  // Check for existing session on mount
  useEffect(() => {
    checkSession()
  }, [])

  async function checkSession() {
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        setIsLoading(false)
        return
      }

      // Verify token with server function
      const { verifyServerFn } = await import('../routes/api.auth.verify')
      const result = await verifyServerFn({ data: token })

      if (result.success && result.user) {
        setUser(result.user)
        // Ensure cookie is set if we have a valid token
        const token = localStorage.getItem('auth_token')
        if (token) {
          document.cookie = `auth_token=${token}; path=/; max-age=${60 * 60 * 24 * 7}` // 7 days
        }
      } else {
        // Invalid token, remove it
        localStorage.removeItem('auth_token')
        document.cookie = 'auth_token=; path=/; max-age=0'
      }
    } catch (error) {
      console.error('Session check failed:', error)
      localStorage.removeItem('auth_token')
    } finally {
      setIsLoading(false)
    }
  }

  async function login(email: string, password: string) {
    const { loginServerFn } = await import('../routes/api.auth.login')
    const result = await loginServerFn({ data: { email, password } })

    if (!result.success) {
      throw new Error(result.message || 'Login failed')
    }

    if (result.token && result.user) {
      localStorage.setItem('auth_token', result.token)
      // Also set cookie for server-side access
      document.cookie = `auth_token=${result.token}; path=/; max-age=${60 * 60 * 24 * 7}` // 7 days
      setUser(result.user)
      navigate({ to: '/dashboard' })
    }
  }

  async function signup(
    email: string,
    password: string,
    firstName?: string,
    lastName?: string
  ) {
    const { signupServerFn } = await import('../routes/api.auth.signup')
    const result = await signupServerFn({
      data: { email, password, firstName, lastName },
    })

    if (!result.success) {
      throw new Error(result.message || 'Signup failed')
    }

    if (result.token && result.user) {
      localStorage.setItem('auth_token', result.token)
      // Also set cookie for server-side access
      document.cookie = `auth_token=${result.token}; path=/; max-age=${60 * 60 * 24 * 7}` // 7 days
      setUser(result.user)
      navigate({ to: '/dashboard' })
    }
  }

  async function logout() {
    try {
      const { logoutServerFn } = await import('../routes/api.auth.logout')
      await logoutServerFn()
    } catch (error) {
      console.error('Logout request failed:', error)
    } finally {
      localStorage.removeItem('auth_token')
      // Also remove cookie
      document.cookie = 'auth_token=; path=/; max-age=0'
      setUser(null)
      navigate({ to: '/' })
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        signup,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

