import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import * as Auth from '../api/auth'
import { validateJwtBasics } from '../utils/jwt-debug'

export type User = {
  id: string
  email: string
  nicename: string
  displayName: string
}

export type AuthState = {
  accessToken: string | null
  user: User | null
  isLoading: boolean
  error: string | null
}

type AuthContextValue = {
  accessToken: string | null
  user: User | null
  isLoading: boolean
  error: string | null
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshToken: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue>({
  accessToken: null,
  user: null,
  isLoading: false,
  error: null,
  login: async () => {},
  logout: async () => {},
  refreshToken: async () => {}
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Store access token in memory only (not localStorage)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Refs for token refresh management
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const refreshPromiseRef = useRef<Promise<void> | null>(null)

  // Clear any existing refresh timeout
  const clearRefreshTimeout = useCallback(() => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current)
      refreshTimeoutRef.current = null
    }
  }, [])

  // Schedule automatic token refresh
  const scheduleRefresh = useCallback((expiresIn: number) => {
    clearRefreshTimeout()

    // Refresh 2 minutes before expiration (or at 90% of lifetime, whichever is sooner)
    const refreshTime = Math.min(expiresIn - 120, expiresIn * 0.9) * 1000

    refreshTimeoutRef.current = setTimeout(async () => {
      console.log('🔄 JWT Debug - Auto-refreshing token...')
      try {
        await refreshToken() // Not silent - we want to see auto-refresh logs
      } catch (error) {
        console.error('🔄 JWT Debug - Auto-refresh failed:', error)
        // If refresh fails, user will need to log in again
        setAccessToken(null)
        setUser(null)
      }
    }, refreshTime)
  }, [])

  // Refresh token function
  const refreshToken = useCallback(async (silent = false) => {
    // If there's already a refresh in progress, return that promise
    if (refreshPromiseRef.current) {
      return refreshPromiseRef.current
    }

    refreshPromiseRef.current = (async () => {
      try {
        if (!silent) {
          console.log('🔄 JWT Debug - Refreshing token...')
        }

        const response = await Auth.refresh()

        setAccessToken(response.access_token)
        setError(null)

        // Schedule next refresh
        scheduleRefresh(response.expires_in)

        console.log('🔄 JWT Debug - Token refreshed successfully')
        validateJwtBasics(response.access_token)

      } catch (error) {
        if (!silent) {
          console.error('🔄 JWT Debug - Token refresh failed:', error)
          setError('Session expired. Please log in again.')
        }
        setAccessToken(null)
        setUser(null)
        throw error
      } finally {
        refreshPromiseRef.current = null
      }
    })()

    return refreshPromiseRef.current
  }, [scheduleRefresh])

  // Login function
  const login = useCallback(async (username: string, password: string) => {
    setIsLoading(true)
    setError(null)

    try {
      console.log('🔍 JWT Debug - Attempting login...')
      const response = await Auth.login(username, password)

      setAccessToken(response.access_token)
      setUser(response.user)

      // Schedule automatic token refresh
      scheduleRefresh(response.expires_in)

      console.log('🔍 JWT Debug - Login successful:', response.user)
      validateJwtBasics(response.access_token)

    } catch (error: any) {
      console.error('🔍 JWT Debug - Login failed:', error)
      const errorMessage = error.response?.data?.error || error.message || 'Login failed'
      setError(errorMessage)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [scheduleRefresh])

  // Logout function
  const logout = useCallback(async () => {
    setIsLoading(true)

    try {
      console.log('🔍 JWT Debug - Logging out...')
      await Auth.logout()
    } catch (error) {
      console.error('🔍 JWT Debug - Logout error:', error)
    } finally {
      // Clear all auth state
      clearRefreshTimeout()
      setAccessToken(null)
      setUser(null)
      setError(null)
      setIsLoading(false)
      refreshPromiseRef.current = null

      console.log('🔍 JWT Debug - Logged out successfully')
    }
  }, [clearRefreshTimeout])

  // Try to refresh token on app load (silent login)
  useEffect(() => {
    let isMounted = true

    const attemptSilentLogin = async () => {
      try {
        console.log('🔍 JWT Debug - Attempting silent login on app load...')
        console.log('🔍 JWT Debug - Auth server URL:', import.meta.env.VITE_AUTH_SERVER_URL || 'http://localhost:3001')

        const response = await Auth.refresh()
        console.log('🔍 JWT Debug - Refresh response:', response)

        if (isMounted) {
          setAccessToken(response.access_token)
          scheduleRefresh(response.expires_in)

          // Get user profile after successful refresh
          const profile = await Auth.getProfile(response.access_token)
          setUser(profile.user)
          console.log('🔍 JWT Debug - Silent login successful, user:', profile.user)
        }
      } catch (error: any) {
        // Silent failure - this is expected on first visit or after logout
        console.log('🔍 JWT Debug - Silent login failed:', error.message || error)
        console.log('🔍 JWT Debug - Error details:', error.response?.data || error.response || 'No additional details')
      }
    }

    attemptSilentLogin()

    return () => {
      isMounted = false
    }
  }, [scheduleRefresh])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearRefreshTimeout()
    }
  }, [clearRefreshTimeout])

  const value: AuthContextValue = {
    accessToken,
    user,
    isLoading,
    error,
    login,
    logout,
    refreshToken
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}