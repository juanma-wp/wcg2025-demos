import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { wpApi } from '../api/wp'

export default function Profile() {
  const { token } = useAuth()
  const api = wpApi(() => token)
  const [profile, setProfile] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function fetchProfile() {
    if (!token) return
    setLoading(true); setError(null)
    try { setProfile(await api.me()) } catch (e: any) { setError(e?.message || 'Failed') } finally { setLoading(false) }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Profile</h2>
      </div>

      {!token && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">Please login first to fetch your profile.</p>
        </div>
      )}

      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <button 
          onClick={fetchProfile} 
          disabled={!token || loading}
          className={`w-full py-2 px-4 rounded-md font-medium transition-colors ${
            !token || loading
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
              : 'bg-blue-500 hover:bg-blue-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
          }`}
        >
          {loading ? 'Loading…' : 'Fetch Profile'}
        </button>

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {profile && (
          <div className="mt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Profile Data</h3>
            <div className="bg-gray-50 rounded-lg p-4 overflow-auto">
              <pre className="text-sm text-gray-800 font-mono">
                {JSON.stringify(profile, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}