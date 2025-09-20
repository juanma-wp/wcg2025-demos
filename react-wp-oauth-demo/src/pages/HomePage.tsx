import React from 'react';
import { useAuth } from '../context/AuthContext';
import ErrorMessage from '../components/ErrorMessage';
import { SCOPE_DESCRIPTIONS } from '../utils/oauth';

const HomePage: React.FC = () => {
  const { isAuthenticated, user, grantedScopes, login, error, clearError } = useAuth();

  const handleLogin = () => {
    // Request comprehensive permissions - WordPress will show consent screen
    login(['read', 'write', 'upload_files', 'moderate_comments']);
  };

  if (isAuthenticated && user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        {error && <ErrorMessage message={error} onDismiss={clearError} />}

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Welcome to WordPress OAuth2 Demo!
          </h2>
          <p className="text-gray-600 mb-6">
            You are now authenticated using OAuth2 with WordPress. This demo showcases
            the OAuth2 Authorization Code flow with the @wp-rest-auth-multi plugin.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* User Information Card */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Profile</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-500">User ID</label>
                <p className="text-gray-900">{user.id}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Username</label>
                <p className="text-gray-900">{user.username}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Display Name</label>
                <p className="text-gray-900">{user.display_name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Email</label>
                <p className="text-gray-900">{user.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Roles</label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {user.roles.map((role, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {role}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Granted Permissions */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Granted Permissions</h3>
            <p className="text-gray-600 text-sm mb-4">
              You have granted this application access to the following permissions:
            </p>

            {grantedScopes.length > 0 ? (
              <div className="space-y-3">
                {grantedScopes.map((scope, index) => (
                  <div key={index} className="flex items-start">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center h-6 w-6 rounded-full bg-green-100 text-green-600 text-sm">
                        ✓
                      </div>
                    </div>
                    <div className="ml-3">
                      <h4 className="text-sm font-medium text-gray-900 capitalize">
                        {scope.replace('_', ' ')}
                      </h4>
                      <p className="text-xs text-gray-500">
                        {SCOPE_DESCRIPTIONS[scope] || 'Custom permission'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <div className="text-gray-400 text-sm">
                  No specific permissions recorded
                </div>
              </div>
            )}
          </div>
        </div>

        {/* API Testing Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">API Testing</h3>
          <p className="text-gray-600 mb-4">
            Your access token is now available for making authenticated requests to the WordPress REST API.
          </p>
          <div className="bg-gray-50 rounded-md p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Sample API Endpoints:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• GET <code className="text-blue-600">/wp-json/wp/v2/posts</code> - Fetch posts</li>
              <li>• GET <code className="text-blue-600">/wp-json/wp/v2/users/me</code> - Get current user</li>
              <li>• POST <code className="text-blue-600">/wp-json/wp/v2/posts</code> - Create a post</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {error && <ErrorMessage message={error} onDismiss={clearError} />}

      {/* Header Section */}
      <div className="text-center mb-8">
        <svg className="mx-auto h-16 w-16 text-blue-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          WordPress OAuth2 Demo
        </h2>
        <p className="text-lg text-gray-600">
          Secure authentication with WordPress using OAuth2 Authorization Code flow
        </p>
      </div>

      {/* Two Column Layout */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left Column - Connection Button and Quick Info */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Get Started</h3>
            <p className="text-gray-600 mb-6">
              Connect your React application with WordPress using secure OAuth2 authentication.
            </p>

            <button
              onClick={handleLogin}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-lg transition-colors inline-flex items-center justify-center mb-4"
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm-1 15l-4-4 1.41-1.41L11 14.17l6.59-6.59L19 9l-8 8z"/>
              </svg>
              Connect with WordPress OAuth2
            </button>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-amber-600 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div>
                  <h4 className="text-sm font-medium text-amber-900">Demo Permissions</h4>
                  <p className="text-sm text-amber-800">
                    This app will request: reading content, writing posts, uploading files, and moderating comments.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* OAuth Flow Steps */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">OAuth2 Flow</h3>
            <div className="space-y-4">
              <div className="flex items-center">
                <div className="bg-blue-100 rounded-full h-8 w-8 flex items-center justify-center mr-3">
                  <span className="text-blue-600 font-semibold text-sm">1</span>
                </div>
                <div>
                  <p className="font-medium text-sm">Authorization Request</p>
                  <p className="text-gray-600 text-xs">Redirect to WordPress OAuth</p>
                </div>
              </div>
              <div className="flex items-center">
                <div className="bg-blue-100 rounded-full h-8 w-8 flex items-center justify-center mr-3">
                  <span className="text-blue-600 font-semibold text-sm">2</span>
                </div>
                <div>
                  <p className="font-medium text-sm">User Authorization</p>
                  <p className="text-gray-600 text-xs">Login and grant permissions</p>
                </div>
              </div>
              <div className="flex items-center">
                <div className="bg-blue-100 rounded-full h-8 w-8 flex items-center justify-center mr-3">
                  <span className="text-blue-600 font-semibold text-sm">3</span>
                </div>
                <div>
                  <p className="font-medium text-sm">Token Exchange</p>
                  <p className="text-gray-600 text-xs">Get access token and user info</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Detailed Information */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">What This Demo Will Show</h3>
            <p className="text-gray-600 mb-4">
              When you click the connection button, you'll be redirected to WordPress where you can:
            </p>

            <div className="space-y-3">
              <div className="flex items-start">
                <span className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold mr-3 mt-0.5">1</span>
                <div>
                  <div className="font-medium text-gray-900">Login to WordPress</div>
                  <div className="text-sm text-gray-600">If you're not already logged in</div>
                </div>
              </div>

              <div className="flex items-start">
                <span className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold mr-3 mt-0.5">2</span>
                <div>
                  <div className="font-medium text-gray-900">Review Permissions</div>
                  <div className="text-sm text-gray-600">See exactly what access this app is requesting</div>
                </div>
              </div>

              <div className="flex items-start">
                <span className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold mr-3 mt-0.5">3</span>
                <div>
                  <div className="font-medium text-gray-900">Grant or Deny Access</div>
                  <div className="text-sm text-gray-600">Choose to approve or reject the permissions</div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default HomePage;