import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { wpApi } from '../api/wp'

export default function Publish() {
  const { token } = useAuth()
  const api = wpApi(() => token)
  const [title, setTitle] = useState('My API Post')
  const [content, setContent] = useState('Hello from the API!')
  const [status, setStatus] = useState<'draft' | 'publish'>('draft')
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!token) return
    setLoading(true); setError(null); setResult(null)
    try { setResult(await api.createPost({ title, content, status })) }
    catch (e: any) { setError(e?.message || 'Failed to publish') }
    finally { setLoading(false) }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Publish Post</h2>
      </div>

      {!token && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">Please login first to create posts.</p>
        </div>
      )}

      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Title
            </label>
            <input 
              id="title"
              type="text"
              value={title} 
              onChange={e=>setTitle(e.target.value)} 
              required 
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Enter post title"
            />
          </div>

          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
              Content
            </label>
            <textarea 
              id="content"
              value={content} 
              onChange={e=>setContent(e.target.value)} 
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Enter post content"
            />
          </div>

          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select 
              id="status"
              value={status} 
              onChange={e=>setStatus(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <option value="draft">Draft</option>
              <option value="publish">Publish</option>
            </select>
          </div>

          <button 
            disabled={!token || loading} 
            type="submit"
            className={`w-full py-2 px-4 rounded-md font-medium transition-colors ${
              !token || loading 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : 'bg-blue-500 hover:bg-blue-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
            }`}
          >
            {loading ? 'Publishing…' : 'Create Post'}
          </button>
        </form>

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {result && (
          <div className="mt-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <div className="flex items-center">
                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center mr-3">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-green-800 font-medium">Post created successfully!</p>
              </div>
              {result.link && (
                <div className="mt-3">
                  <a 
                    href={result.link} 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline text-sm"
                  >
                    View Post: {result.link}
                  </a>
                </div>
              )}
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Response Data</h3>
              <div className="bg-gray-50 rounded-lg p-4 overflow-auto">
                <pre className="text-sm text-gray-800 font-mono">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}