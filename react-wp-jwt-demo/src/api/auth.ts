import { makeClient } from '../lib/http'

// WordPress configuration from environment variables
const WP_BASE_URL = import.meta.env.VITE_WP_BASE_URL || 'https://wcg2025-demo.wp.local/'
const WP_JWT_NAMESPACE = import.meta.env.VITE_WP_JWT_NAMESPACE || 'jwt/v1'

// WordPress API client - connect directly to WordPress with custom base URL
const wpClient = makeClient(WP_BASE_URL.replace(/\/$/, ''))

export type LoginResponse = {
  access_token: string
  user: {
    id: string
    email: string
    nicename: string
    displayName: string
  }
  expires_in: number
}

export type RefreshResponse = {
  access_token: string
  expires_in: number
}

export async function login(username: string, password: string): Promise<LoginResponse> {
  const res = await wpClient.post(`wp-json/${WP_JWT_NAMESPACE}/token`, {
    json: { username, password },
    credentials: 'include'
  }).json<any>()

  const data = res.data || res
  const user = data.user || {}

  return {
    access_token: data.access_token || data.token,
    user: {
      id: String(user.id || user.ID || user.user_id || ''),
      email: user.email || user.user_email || '',
      nicename: user.username || user.user_nicename || user.nicename || '',
      displayName: user.username || user.display_name || user.user_display_name || ''
    },
    expires_in: data.expires_in || 3600
  }
}

export async function refresh(): Promise<RefreshResponse> {
  const res = await wpClient.post(`wp-json/${WP_JWT_NAMESPACE}/refresh`, {
    credentials: 'include'
  }).json<any>()

  const data = res.data || res

  return {
    access_token: data.access_token || data.token,
    expires_in: data.expires_in || 3600
  }
}

export async function logout(): Promise<void> {
  await wpClient.post(`wp-json/${WP_JWT_NAMESPACE}/logout`, {
    credentials: 'include'
  })
}

export async function getProfile(accessToken: string) {
  // Use the plugin's verify endpoint to get user profile
  const wpClientWithAuth = makeClient(WP_BASE_URL.replace(/\/$/, ''), () => accessToken)

  const res = await wpClientWithAuth.get(`wp-json/${WP_JWT_NAMESPACE}/verify`).json<any>()

  // Plugin returns data in res.data object
  const data = res.data || res
  const user = data.user || {}

  return {
    user: {
      id: String(user.id || user.ID || user.user_id || ''),
      email: user.email || user.user_email || '',
      nicename: user.username || user.user_nicename || user.nicename || '',
      displayName: user.username || user.display_name || user.user_display_name || ''
    }
  }
}