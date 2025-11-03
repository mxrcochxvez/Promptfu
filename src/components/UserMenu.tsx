import { Link } from '@tanstack/react-router'
import { useAuth } from '../contexts/AuthContext'
import { LogIn, LogOut, User, UserPlus } from 'lucide-react'

export default function UserMenu() {
  const { user, isAuthenticated, logout } = useAuth()

  if (isAuthenticated && user) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-3 px-3 py-2.5 bg-neutral-800/40 rounded-xl border border-neutral-800/50">
          {user.firstName || user.lastName ? (
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-olive-500 to-olive-600 rounded-full text-white font-semibold text-sm shadow-lg shadow-olive-500/20">
              {(user.firstName?.[0] || '') + (user.lastName?.[0] || '') || user.email[0].toUpperCase()}
            </div>
          ) : (
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-olive-500 to-olive-600 rounded-full text-white font-semibold text-sm shadow-lg shadow-olive-500/20">
              {user.email[0].toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-neutral-50 font-medium text-sm truncate">
              {user.firstName || user.lastName
                ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
                : user.email}
            </p>
            <p className="text-neutral-400 text-xs truncate">{user.email}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-neutral-800/40 transition-all duration-200 text-left group"
        >
          <LogOut size={18} className="text-neutral-300 group-hover:text-red-400 transition-colors" />
          <span className="font-medium text-neutral-200">Sign Out</span>
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <Link
        to="/login"
        className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-neutral-800/40 transition-all duration-200 group"
      >
        <LogIn size={18} className="text-neutral-300 group-hover:text-olive-400 transition-colors" />
        <span className="font-medium text-neutral-200">Sign In</span>
      </Link>
      <Link
        to="/signup"
        className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-neutral-800/40 transition-all duration-200 group"
      >
        <UserPlus size={18} className="text-neutral-300 group-hover:text-olive-400 transition-colors" />
        <span className="font-medium text-neutral-200">Sign Up</span>
      </Link>
    </div>
  )
}

