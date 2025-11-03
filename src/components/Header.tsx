import { Link } from '@tanstack/react-router'
import { useAuth } from '../contexts/AuthContext'
import UserMenu from './UserMenu'

import { useState } from 'react'
import {
  Home,
  Menu,
  X,
  LayoutDashboard,
  BookOpen,
  Settings,
  Users,
  MessageSquare,
} from 'lucide-react'

export default function Header() {
  const [isOpen, setIsOpen] = useState(false)
  const { user } = useAuth()
  
  const isAdmin = user?.isAdmin || false

  return (
    <>
      {/* Backdrop overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      <header className="sticky top-0 z-30 glass-effect border-b border-neutral-800/50">
        <div className="px-4 md:px-6 py-3 flex items-center">
          <button
            onClick={() => setIsOpen(true)}
            className="p-2.5 hover:bg-neutral-800/50 rounded-xl transition-all duration-200 hover:scale-105 focus-ring"
            aria-label="Open menu"
          >
            <Menu size={22} className="text-neutral-200" />
          </button>
          <Link 
            to={user ? "/dashboard" : "/"} 
            className="ml-3 flex items-center hover:opacity-90 transition-opacity duration-200"
          >
            <img 
              src="/promptfu-logo.png" 
              alt="Promptfu - AI Learning Resources" 
              className="h-7 w-auto"
            />
          </Link>
        </div>
      </header>

      <aside
        className={`fixed top-0 left-0 h-full w-80 glass-effect text-white z-50 transform transition-transform duration-300 ease-out flex flex-col shadow-2xl ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800/50">
          <h2 className="text-lg font-bold text-neutral-50">Navigation</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-neutral-800/50 rounded-lg transition-all duration-200 hover:scale-110 focus-ring"
            aria-label="Close menu"
          >
            <X size={20} className="text-neutral-300" />
          </button>
        </div>

        <nav className="flex-1 px-4 py-4 overflow-y-auto space-y-1">
          {!user && (
            <Link
              to="/"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-neutral-800/40 transition-all duration-200 group mb-1"
              activeProps={{
                className:
                  'flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-olive-600/20 to-olive-500/10 border border-olive-500/30 transition-all duration-200 mb-1',
              }}
            >
              <Home size={20} className="text-neutral-300 group-hover:text-olive-400 transition-colors" />
              <span className="font-medium text-neutral-200">Home</span>
            </Link>
          )}

          {user && (
            <>
              <Link
                to="/dashboard"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-neutral-800/40 transition-all duration-200 group mb-1"
                activeProps={{
                  className:
                    'flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-olive-600/20 to-olive-500/10 border border-olive-500/30 transition-all duration-200 mb-1',
                }}
              >
                <LayoutDashboard size={20} className="text-neutral-300 group-hover:text-olive-400 transition-colors" />
                <span className="font-medium text-neutral-200">Dashboard</span>
              </Link>
              <Link
                to="/communities"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-neutral-800/40 transition-all duration-200 group mb-1"
                activeProps={{
                  className:
                    'flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-olive-600/20 to-olive-500/10 border border-olive-500/30 transition-all duration-200 mb-1',
                }}
              >
                <MessageSquare size={20} className="text-neutral-300 group-hover:text-olive-400 transition-colors" />
                <span className="font-medium text-neutral-200">Communities</span>
              </Link>
            </>
          )}

          {isAdmin && (
            <div className="pt-4 mt-4 border-t border-neutral-800/50">
              <div className="px-4 mb-2">
                <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Admin</span>
              </div>
              <Link
                to="/admin/classes"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-neutral-800/40 transition-all duration-200 group mb-1"
                activeProps={{
                  className:
                    'flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-olive-600/20 to-olive-500/10 border border-olive-500/30 transition-all duration-200 mb-1',
                }}
              >
                <BookOpen size={20} className="text-neutral-300 group-hover:text-olive-400 transition-colors" />
                <span className="font-medium text-neutral-200">Classes</span>
              </Link>
              <Link
                to="/admin/users"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-neutral-800/40 transition-all duration-200 group mb-1"
                activeProps={{
                  className:
                    'flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-olive-600/20 to-olive-500/10 border border-olive-500/30 transition-all duration-200 mb-1',
                }}
              >
                <Users size={20} className="text-neutral-300 group-hover:text-olive-400 transition-colors" />
                <span className="font-medium text-neutral-200">Users</span>
              </Link>
            </div>
          )}
        </nav>

        <div className="px-4 py-4 border-t border-neutral-800/50 bg-neutral-900/30 flex flex-col gap-2">
          <UserMenu />
        </div>
      </aside>
    </>
  )
}
