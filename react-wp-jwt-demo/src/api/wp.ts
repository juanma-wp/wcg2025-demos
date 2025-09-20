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
  // Extract WordPress token from our access token payload
  const getWordPressToken = () => {
    const accessToken = getAccessToken()
    if (!accessToken) return null

    const decoded = decodeJwtPayload(accessToken)
    return decoded?.payload?.wpToken || null
  }

  const http = makeClient(undefined, getWordPressToken)
  return {
    me: () => http.get('wp/v2/users/me', { searchParams: { context: 'edit' } }).json<WpUser>(),
    createPost: (payload: { title: string; content: string; status: 'draft' | 'publish' }) =>
      http.post('wp/v2/posts', { json: payload }).json<WpPost>(),
  }
}