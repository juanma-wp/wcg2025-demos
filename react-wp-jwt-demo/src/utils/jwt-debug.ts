// JWT Debugging Utilities
export function decodeJwtPayload(token: string) {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) {
      console.error('🔍 JWT Debug - Invalid token format (should have 3 parts)')
      return null
    }

    const payload = JSON.parse(atob(parts[1]))
    console.log('🔍 JWT Debug - Decoded payload:', payload)
    
    // Check expiration
    const now = Math.floor(Date.now() / 1000)
    const exp = payload.exp
    const isExpired = exp && now > exp
    
    console.log('🔍 JWT Debug - Current time:', now)
    console.log('🔍 JWT Debug - Token expires:', exp)
    console.log('🔍 JWT Debug - Is expired:', isExpired)
    console.log('🔍 JWT Debug - Issuer:', payload.iss)
    console.log('🔍 JWT Debug - User ID:', payload.data?.user?.id)
    
    return {
      payload,
      isExpired,
      timeToExpiry: exp ? exp - now : null
    }
  } catch (error) {
    console.error('🔍 JWT Debug - Failed to decode token:', error)
    return null
  }
}

export function validateJwtBasics(token: string) {
  console.log('🔍 JWT Debug - Validating token basics...')
  
  if (!token) {
    console.error('🔍 JWT Debug - No token provided')
    return false
  }
  
  if (!token.startsWith('eyJ')) {
    console.error('🔍 JWT Debug - Token does not start with expected JWT header')
    return false
  }
  
  const decoded = decodeJwtPayload(token)
  if (!decoded) {
    console.error('🔍 JWT Debug - Failed to decode token')
    return false
  }
  
  if (decoded.isExpired) {
    console.error('🔍 JWT Debug - Token is expired')
    return false
  }
  
  console.log('🔍 JWT Debug - Token appears valid')
  return true
}
