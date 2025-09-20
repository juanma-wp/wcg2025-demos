import React from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function Navbar() {
  const { accessToken, user, logout } = useAuth()
  return (
    <header className="border-b border-gray-200 bg-white shadow-sm">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors">
          WP JWT Demo
        </Link>
        <nav className="flex space-x-6">
          <NavLink 
            to="/" 
            end 
            className={({ isActive }) => 
              `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`
            }
          >
            Home
          </NavLink>
          <NavLink 
            to="/profile"
            className={({ isActive }) => 
              `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`
            }
          >
            Profile
          </NavLink>
          <NavLink 
            to="/publish"
            className={({ isActive }) => 
              `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`
            }
          >
            Publish
          </NavLink>
        </nav>
        <div className="flex items-center space-x-3">
          {accessToken && user ? (
            <>
              <span className="text-sm text-gray-600">Hi, {user.displayName || 'user'}</span>
              <button
                onClick={logout}
                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md text-sm font-medium transition-colors"
              >
                Logout
              </button>
            </>
          ) : (
            <span className="text-sm text-gray-500">Not signed in</span>
          )}
        </div>
      </div>
    </header>
  )
}