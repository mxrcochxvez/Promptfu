import { Link } from '@tanstack/react-router'
import { useAuth } from '../contexts/AuthContext'
import { LogIn, LogOut, User, UserPlus } from 'lucide-react'

export default function UserMenu() {
  const { user, isAuthenticated, logout } = useAuth()

  if (isAuthenticated && user) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 p-2 bg-gray-700 rounded-lg">
          {user.firstName || user.lastName ? (
            <div className="flex items-center justify-center w-8 h-8 bg-olive-500 rounded-full text-white font-semibold text-sm">
              {(user.firstName?.[0] || '') + (user.lastName?.[0] || '') || user.email[0].toUpperCase()}
            </div>
          ) : (
            <div className="flex items-center justify-center w-8 h-8 bg-olive-500 rounded-full text-white font-semibold text-sm">
              {user.email[0].toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-white font-medium text-sm truncate">
              {user.firstName || user.lastName
                ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
                : user.email}
            </p>
            <p className="text-gray-400 text-xs truncate">{user.email}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors text-left"
        >
          <LogOut size={20} />
          <span className="font-medium">Sign Out</span>
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <Link
        to="/login"
        className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors"
      >
        <LogIn size={20} />
        <span className="font-medium">Sign In</span>
      </Link>
      <Link
        to="/signup"
        className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors"
      >
        <UserPlus size={20} />
        <span className="font-medium">Sign Up</span>
      </Link>
    </div>
  )
}

