import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Global flag to prevent double processing across component re-renders
let globalProcessingFlag = false;

const CallbackPage: React.FC = () => {
  const { handleCallback } = useAuth();
  const navigate = useNavigate();

  const hasProcessed = useRef(false);

  useEffect(() => {
    const processCallback = async () => {
      // Check both local and global flags
      if (hasProcessed.current || globalProcessingFlag) {
        console.log('🔍 OAuth Debug: Skipping duplicate callback processing');
        return;
      }

      // Set both flags immediately
      hasProcessed.current = true;
      globalProcessingFlag = true;

      const currentUrl = window.location.href;
      console.log('🔍 OAuth Debug: Processing callback (single execution)');

      try {
        const success = await handleCallback(currentUrl);

        if (success) {
          // Redirect to the main app after successful authentication
          navigate('/', { replace: true });
        } else {
          // Redirect to home page to show error
          navigate('/', { replace: true });
        }
      } finally {
        // Reset global flag after a short delay to allow for navigation
        setTimeout(() => {
          globalProcessingFlag = false;
        }, 1000);
      }
    };

    processCallback();
  }, [handleCallback, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Processing Authentication...
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Please wait while we complete your login.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CallbackPage;