import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { decodeJwtPayload } from '../utils/jwt-debug'

export default function LoginForm() {
  const { accessToken, user, login, logout, isLoading: authLoading, error: authError } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await login(username, password)
      setUsername('')
      setPassword('')
    } catch (e: any) {
      setError(e?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const isLoadingState = loading || authLoading

  if (accessToken && user) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 max-w-md">
        <div className="flex items-center mb-3">
          <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center mr-3">
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-green-800 font-medium">Authenticated</p>
          <span className="ml-2 text-sm text-green-600">({user.email})</span>
        </div>
        <div className="bg-gray-50 rounded p-3 mb-4 space-y-3">
          <div>
            <p className="text-xs font-medium text-gray-700 mb-2">Full JWT Token:</p>
            <div className="bg-white rounded border p-2 max-h-32 overflow-y-auto">
              <code className="text-xs text-gray-800 break-all font-mono leading-relaxed">
                {accessToken}
              </code>
            </div>
          </div>
          
          {(() => {
            const decoded = decodeJwtPayload(accessToken)
            if (!decoded) return null
            
            const expiryDate = decoded.payload.exp ? new Date(decoded.payload.exp * 1000) : null
            const issuedDate = decoded.payload.iat ? new Date(decoded.payload.iat * 1000) : null
            
            return (
              <div>
                <p className="text-xs font-medium text-gray-700 mb-2">JWT Content:</p>
                <div className="bg-white rounded border p-3 space-y-2">
                  <div className="grid grid-cols-1 gap-2 text-xs">
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">User ID:</span>
                      <span className="text-gray-800">{decoded.payload.userId || user.id || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Email:</span>
                      <span className="text-gray-800">{decoded.payload.email || user.email || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Display Name:</span>
                      <span className="text-gray-800">{decoded.payload.displayName || user.displayName || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Issuer:</span>
                      <span className="text-gray-800 break-all">{decoded.payload.iss || 'N/A'}</span>
                    </div>
                    {issuedDate && (
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-600">Issued:</span>
                        <span className="text-gray-800">{issuedDate.toLocaleString()}</span>
                      </div>
                    )}
                    {expiryDate && (
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-600">Expires:</span>
                        <span className={`${decoded.isExpired ? 'text-red-600' : 'text-gray-800'}`}>
                          {expiryDate.toLocaleString()}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Status:</span>
                      <span className={`font-medium ${decoded.isExpired ? 'text-red-600' : 'text-green-600'}`}>
                        {decoded.isExpired ? 'Expired' : 'Valid'}
                      </span>
                    </div>
                  </div>
                  
                  <details className="mt-3">
                    <summary className="text-xs font-medium text-gray-600 cursor-pointer hover:text-gray-800">
                      Raw Payload (click to expand)
                    </summary>
                    <div className="mt-2 bg-gray-50 rounded p-2 max-h-32 overflow-y-auto">
                      <pre className="text-xs text-gray-700 font-mono">
                        {JSON.stringify(decoded.payload, null, 2)}
                      </pre>
                    </div>
                  </details>
                </div>
              </div>
            )
          })()}
        </div>
        <button 
          onClick={logout}
          className="w-full bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md font-medium transition-colors"
        >
          Logout
        </button>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm max-w-md">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Sign In</h2>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
            Username
          </label>
          <input 
            id="username"
            type="text"
            value={username} 
            onChange={e=>setUsername(e.target.value)} 
            required 
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            placeholder="Enter your username"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
            Password
          </label>
          <input 
            id="password"
            type="password" 
            value={password} 
            onChange={e=>setPassword(e.target.value)} 
            required 
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            placeholder="Enter your password"
          />
        </div>
        <button
          disabled={isLoadingState}
          type="submit"
          className={`w-full py-2 px-4 rounded-md font-medium transition-colors ${
            isLoadingState
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
          } text-white`}
        >
          {isLoadingState ? 'Signing in…' : 'Get JWT'}
        </button>
        {(error || authError) && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-red-600 text-sm">{error || authError}</p>
          </div>
        )}
      </form>
    </div>
  )
}