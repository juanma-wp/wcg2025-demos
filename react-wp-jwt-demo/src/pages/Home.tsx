import React from 'react'
import LoginForm from '../components/LoginForm'

export default function Home() {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Welcome</h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          This demo authenticates against a WordPress site with the JWT plugin enabled.
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Getting Started</h3>
          <ol className="space-y-3">
            <li className="flex items-start">
              <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-600 text-sm font-medium rounded-full mr-3 mt-0.5">1</span>
              <span className="text-gray-700">
                Set <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">VITE_WP_BASE_URL</code> in{' '}
                <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">.env.local</code>.
              </span>
            </li>
            <li className="flex items-start">
              <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-600 text-sm font-medium rounded-full mr-3 mt-0.5">2</span>
              <span className="text-gray-700">Use a real WP user to log in and obtain a token.</span>
            </li>
            <li className="flex items-start">
              <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-600 text-sm font-medium rounded-full mr-3 mt-0.5">3</span>
              <span className="text-gray-700">
                Visit <strong className="font-medium text-gray-900">Profile</strong> to fetch your user info.
              </span>
            </li>
            <li className="flex items-start">
              <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-600 text-sm font-medium rounded-full mr-3 mt-0.5">4</span>
              <span className="text-gray-700">
                Visit <strong className="font-medium text-gray-900">Publish</strong> to create a post.
              </span>
            </li>
          </ol>
        </div>
        
        <div>
          <LoginForm />
        </div>
      </div>
    </div>
  )
}