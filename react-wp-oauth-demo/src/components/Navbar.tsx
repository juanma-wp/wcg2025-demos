import React from 'react';
import { useAuth } from '../context/AuthContext';

const Navbar: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <nav className="bg-blue-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-bold">WordPress OAuth2 Demo</h1>
          </div>
          <div className="flex items-center space-x-4">
            {isAuthenticated && (
              <>
                <span className="text-sm">
                  Welcome, <strong>{user?.display_name || user?.username}</strong>
                </span>
                <button
                  onClick={logout}
                  className="bg-blue-500 hover:bg-blue-400 px-4 py-2 rounded transition-colors"
                >
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;