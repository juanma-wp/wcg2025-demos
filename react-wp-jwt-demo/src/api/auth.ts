import { makeClient } from '../lib/http'

// Client for our auth server
const authClient = makeClient('http://localhost:3001')

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
  const res = await authClient.post('api/login', {
    json: { username, password },
    credentials: 'include' // Include cookies for refresh token
  }).json<LoginResponse>()
  return res
}

export async function refresh(): Promise<RefreshResponse> {
  const res = await authClient.post('api/refresh', {
    credentials: 'include' // Include refresh token cookie
  }).json<RefreshResponse>()
  return res
}

export async function logout(): Promise<void> {
  await authClient.post('api/logout', {
    credentials: 'include' // Include refresh token cookie
  })
}

export async function getProfile(accessToken: string) {
  const res = await authClient.get('api/me', {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  }).json()
  return res
}