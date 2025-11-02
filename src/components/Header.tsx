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
} from 'lucide-react'

export default function Header() {
  const [isOpen, setIsOpen] = useState(false)
  const { user } = useAuth()
  
  const isAdmin = user?.isAdmin || false

  return (
    <>
      <header className="p-4 flex items-center bg-gray-800 text-white shadow-lg">
        <button
          onClick={() => setIsOpen(true)}
          className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          aria-label="Open menu"
        >
          <Menu size={24} />
        </button>
        <Link 
          to={user ? "/dashboard" : "/"} 
          className="ml-4 flex items-center hover:opacity-80 transition-opacity"
        >
          <img 
            src="/promptfu-logo.png" 
            alt="Promptfu - AI Learning Resources" 
            className="h-8 w-auto"
          />
        </Link>
      </header>

      <aside
        className={`fixed top-0 left-0 h-full w-80 bg-gray-900 text-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold">Navigation</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            aria-label="Close menu"
          >
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto">
          {!user && (
            <Link
              to="/"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors mb-2"
              activeProps={{
                className:
                  'flex items-center gap-3 p-3 rounded-lg bg-olive-600 hover:bg-olive-700 transition-colors mb-2',
              }}
            >
              <Home size={20} />
              <span className="font-medium">Home</span>
            </Link>
          )}

          {user && (
            <Link
              to="/dashboard"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors mb-2"
              activeProps={{
                className:
                  'flex items-center gap-3 p-3 rounded-lg bg-olive-600 hover:bg-olive-700 transition-colors mb-2',
              }}
            >
              <LayoutDashboard size={20} />
              <span className="font-medium">Dashboard</span>
            </Link>
          )}

          {isAdmin && (
            <>
              <Link
                to="/admin/classes"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors mb-2"
                activeProps={{
                  className:
                    'flex items-center gap-3 p-3 rounded-lg bg-olive-600 hover:bg-olive-700 transition-colors mb-2',
                }}
              >
                <BookOpen size={20} />
                <span className="font-medium">Classes</span>
              </Link>
              <Link
                to="/admin/users"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors mb-2"
                activeProps={{
                  className:
                    'flex items-center gap-3 p-3 rounded-lg bg-olive-600 hover:bg-olive-700 transition-colors mb-2',
                }}
              >
                <Users size={20} />
                <span className="font-medium">Users</span>
              </Link>
            </>
          )}

          {/* Demo Links Start (keeping for reference, can be removed later) */}

          {/* Demo Links End */}
        </nav>

        <div className="p-4 border-t border-gray-700 bg-gray-800 flex flex-col gap-2">
          <UserMenu />
        </div>
      </aside>
    </>
  )
}
