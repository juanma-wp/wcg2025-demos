import { makeClient } from '../lib/http'

// WordPress configuration from environment variables
const WP_BASE_URL = import.meta.env.VITE_WP_BASE_URL || 'https://wcg2025-demo.wp.local/'

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
  // Connect directly to WordPress REST API
  const http = makeClient(WP_BASE_URL.replace(/\/$/, ''), getAccessToken)

  return {
    me: () => http.get('wp-json/wp/v2/users/me', {
      searchParams: { context: 'edit' }
    }).json<WpUser>(),

    createPost: (payload: { title: string; content: string; status: 'draft' | 'publish' }) =>
      http.post('wp-json/wp/v2/posts', {
        json: payload
      }).json<WpPost>(),
  }
}