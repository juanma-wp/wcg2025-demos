import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import * as Auth from '../api/auth'
import { createSingleton } from '../lib/singleton'

export type User = {
  id: string
  email: string
  nicename: string
  displayName: string
}

type AuthContextValue = {
  accessToken: string | null
  user: User | null
  isLoading: boolean
  error: string | null
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue>({
  accessToken: null,
  user: null,
  isLoading: false,
  error: null,
  login: async () => {},
  logout: async () => {}
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [authCheckCompleted, setAuthCheckCompleted] = useState(false)
  const refreshTimeoutRef = useRef<number | null>(null)

  const clearRefreshTimeout = useCallback(() => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current)
      refreshTimeoutRef.current = null
    }
  }, [])

  const scheduleRefresh = useCallback((expiresIn: number) => {
    clearRefreshTimeout()
    const refreshTime = Math.min(expiresIn - 120, expiresIn * 0.9) * 1000

    refreshTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await Auth.refresh()
        setAccessToken(response.access_token)
        scheduleRefresh(response.expires_in)
      } catch {
        setAccessToken(null)
        setUser(null)
      }
    }, refreshTime)
  }, [clearRefreshTimeout])

  const login = useCallback(async (username: string, password: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await Auth.login(username, password)
      setAccessToken(response.access_token)
      setUser(response.user)
      scheduleRefresh(response.expires_in)
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Login failed'
      setError(errorMessage)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [scheduleRefresh])

  const logout = useCallback(async () => {
    try {
      await Auth.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      clearRefreshTimeout()
      setAccessToken(null)
      setUser(null)
      setError(null)
      setIsLoading(false)
    }
  }, [clearRefreshTimeout])

  // Silent login on app load - singleton ensures it only runs once per reload
  useEffect(() => {
    // Create a singleton for the actual silent login attempt
    const attemptSilentLogin = createSingleton(async () => {
      try {
        const response = await Auth.refresh()
        const profile = await Auth.getProfile(response.access_token)
        
        // Set all auth state
        setAccessToken(response.access_token)
        setUser(profile.user)
        scheduleRefresh(response.expires_in)
      } catch {
        // Silent failure is expected on first visit
      } finally {
        // Mark auth check as completed
        setAuthCheckCompleted(true)
      }
    })

    attemptSilentLogin()
  }, [])

  // Manage loading state based on auth check completion
  useEffect(() => {
    if (authCheckCompleted) {
      setIsLoading(false)
    }
  }, [authCheckCompleted])

  useEffect(() => clearRefreshTimeout, [clearRefreshTimeout])

  const value: AuthContextValue = {
    accessToken,
    user,
    isLoading,
    error,
    login,
    logout
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