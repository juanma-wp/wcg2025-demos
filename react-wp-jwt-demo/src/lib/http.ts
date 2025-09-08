import ky from 'ky'

const baseUrl = import.meta.env.VITE_WP_BASE_URL?.replace(/\/$/, '')

export function makeClient(getToken?: () => string | null) {
  return ky.create({
    prefixUrl: `${baseUrl}/wp-json`,
    hooks: {
      beforeRequest: [ (req) => {
        const t = getToken?.()
        console.log('🔍 JWT Debug - Base URL:', baseUrl)
        console.log('🔍 JWT Debug - Token exists:', !!t)
        console.log('🔍 JWT Debug - Token preview:', t ? `${t.substring(0, 20)}...` : 'none')
        console.log('🔍 JWT Debug - Request URL:', req.url)
        if (t) {
          req.headers.set('Authorization', `Bearer ${t}`)
          console.log('🔍 JWT Debug - Authorization header set')
        }
      }],
      afterResponse: [ (req, options, response) => {
        console.log('🔍 JWT Debug - Response status:', response.status)
        console.log('🔍 JWT Debug - Response headers:', Object.fromEntries(response.headers.entries()))
        return response
      }],
    },
  })
}