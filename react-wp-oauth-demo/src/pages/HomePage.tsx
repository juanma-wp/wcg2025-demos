import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import ErrorMessage from '../components/ErrorMessage';
import ApiTester from '../components/ApiTester';
import { SCOPE_DESCRIPTIONS } from '../utils/oauth';

const HomePage: React.FC = () => {
  const { isAuthenticated, user, grantedScopes, login, error, clearError, loading } = useAuth();

  // Available scopes for selection
  const availableScopes = [
    'read',
    'write',
    'delete',
    'upload_files',
    'moderate_comments',
    'manage_categories'
  ];

  const [selectedScopes, setSelectedScopes] = useState<string[]>(['read', 'write']);

  const handleScopeToggle = (scope: string) => {
    setSelectedScopes(prev =>
      prev.includes(scope)
        ? prev.filter(s => s !== scope)
        : [...prev, scope]
    );
  };

  const handleLogin = () => {
    // Request selected permissions - WordPress will show consent screen
    login(selectedScopes.length > 0 ? selectedScopes : ['read']);
  };

  // Show authentication check loading state during initial load
  if (loading) {
    return (
      <div className="max-w-md mx-auto px-4 py-8">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-8">
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <div className="text-blue-700 text-center">
                <p className="font-medium text-lg">Checking authentication...</p>
                <p className="text-sm text-blue-600">Please wait while we verify your OAuth2 session</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">User ID</label>
                <p className="text-gray-900 font-mono text-sm bg-gray-50 px-2 py-1 rounded">
                  {user.id || 'Not available'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Username</label>
                <p className="text-gray-900 font-medium">
                  {user.username || 'Not available'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Display Name</label>
                <p className="text-gray-900">
                  {user.display_name || user.username || 'Not available'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Email</label>
                <p className="text-gray-900">
                  {user.email || 'Not available'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-2">WordPress Roles</label>
                <div className="flex flex-wrap gap-2">
                  {user.roles && user.roles.length > 0 ? (
                    user.roles.map((role, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200"
                      >
                        {role.charAt(0).toUpperCase() + role.slice(1)}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-500 text-sm">No roles assigned</span>
                  )}
                </div>
              </div>
            </div>

            {/* Authentication Status */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Authentication Status</p>
                  <div className="flex items-center mt-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-sm text-green-700 font-medium">Authenticated via OAuth2</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Token Type</p>
                  <p className="text-sm font-medium text-gray-900">Bearer</p>
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
        <div className="mt-6">
          <ApiTester />
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
        {/* Left Column - Permission Selection and Connection */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Select Permissions</h3>
            <p className="text-gray-600 mb-4">
              Choose which permissions you want to request from WordPress:
            </p>

            <div className="space-y-3 mb-6">
              {availableScopes.map((scope) => (
                <label key={scope} className="flex items-start cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedScopes.includes(scope)}
                    onChange={() => handleScopeToggle(scope)}
                    className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <div className="ml-3">
                    <span className="text-sm font-medium text-gray-900 capitalize">
                      {scope.replace('_', ' ')}
                    </span>
                    <p className="text-xs text-gray-500">
                      {SCOPE_DESCRIPTIONS[scope]}
                    </p>
                  </div>
                </label>
              ))}
            </div>

            <button
              onClick={handleLogin}
              disabled={selectedScopes.length === 0}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-lg transition-colors inline-flex items-center justify-center mb-4"
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm-1 15l-4-4 1.41-1.41L11 14.17l6.59-6.59L19 9l-8 8z"/>
              </svg>
              Request {selectedScopes.length} Permission{selectedScopes.length !== 1 ? 's' : ''}
            </button>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div>
                  <h4 className="text-sm font-medium text-blue-900">How It Works</h4>
                  <p className="text-sm text-blue-800">
                    WordPress will show you exactly what you're granting and let you approve or deny each permission.
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