import { makeClient } from '../lib/http'
import { decodeJwtPayload } from '../utils/jwt-debug'

export type WpUser = {
  id: number
  name: string
  slug: string
  link: string
  url?: string
  description?: string
  avatar_urls?: Record<string, string>
  roles?: string[]
  registered_date?: string
  meta?: any
  acf?: any
}

export type WpPost = {
  id: number
  link: string
  title: { rendered: string }
  content: { rendered: string }
  status: string
}

export function wpApi(getAccessToken: () => string | null) {
  // Use auth server proxy instead of calling WordPress directly
  const AUTH_SERVER_URL = import.meta.env.VITE_AUTH_SERVER_URL || 'http://localhost:3001'
  const http = makeClient(AUTH_SERVER_URL, getAccessToken)

  return {
    me: () => http.get('api/wp/wp/v2/users/me', { searchParams: { context: 'edit' } }).json<WpUser>(),
    createPost: (payload: { title: string; content: string; status: 'draft' | 'publish' }) =>
      http.post('api/wp/wp/v2/posts', { json: payload }).json<WpPost>(),
  }
}