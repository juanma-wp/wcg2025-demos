import React, { createContext, useContext, useMemo, useEffect } from 'react'
import { useLocalStorage } from '../lib/useLocalStorage'
import * as Auth from '../api/auth'
import { validateJwtBasics } from '../utils/jwt-debug'

export type AuthState = {
  token: string | null
  meta: Auth.JwtLoginResponse | null
}

const Ctx = createContext<{
  token: string | null
  meta: Auth.JwtLoginResponse | null
  login: (u: string, p: string) => Promise<void>
  logout: () => void
}>({ token: null, meta: null, async login() {}, logout() {} })

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useLocalStorage<string | null>('jwt_token', null)
  const [meta, setMeta] = useLocalStorage<Auth.JwtLoginResponse | null>('jwt_meta', null)

  // Debug token on load
  useEffect(() => {
    if (token) {
      console.log('🔍 JWT Debug - Stored token found, validating...')
      validateJwtBasics(token)
    } else {
      console.log('🔍 JWT Debug - No stored token found')
    }
  }, [token])

  const value = useMemo(() => ({
    token,
    meta,
    async login(u: string, p: string) {
      console.log('🔍 JWT Debug - Attempting login...')
      const res = await Auth.login(u, p)
      console.log('🔍 JWT Debug - Login response:', res)
      setToken(res.token)
      setMeta(res)
      validateJwtBasics(res.token)
    },
    logout() {
      console.log('🔍 JWT Debug - Logging out...')
      setToken(null)
      setMeta(null)
    }
  }), [token, meta])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export const useAuth = () => useContext(Ctx)