import { useEffect, useState } from 'react';
import { useClerk, useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';

export default function SSOCallback() {
  const navigate = useNavigate();
  const clerk = useClerk();
  const { isLoaded, isSignedIn, user } = useUser();
  const [error, setError] = useState<string>('');
  const [processing, setProcessing] = useState(true);
  
  useEffect(() => {
    // Log the current URL for debugging
    console.log('[SSO Callback] Current URL:', window.location.href);
    console.log('[SSO Callback] Search params:', window.location.search);
    console.log('[SSO Callback] Hash:', window.location.hash);
    
    // Parse query params to check for errors
    const params = new URLSearchParams(window.location.search);
    const errorParam = params.get('error');
    const errorDescription = params.get('error_description');
    
    if (errorParam) {
      console.error('[SSO Callback] OAuth error:', errorParam, errorDescription);
      setError(errorDescription || errorParam);
      setProcessing(false);
      return;
    }
  }, []);

  useEffect(() => {
    if (!isLoaded) {
      console.log('[SSO Callback] Clerk not loaded yet...');
      return;
    }

    console.log('[SSO Callback] Clerk loaded. User state:', {
      isSignedIn,
      userId: user?.id,
      email: user?.primaryEmailAddress?.emailAddress
    });

    // If user is signed in, redirect to hub
    if (isSignedIn && user) {
      console.log('[SSO Callback] User is signed in, redirecting to /hub');
      setProcessing(false);
      navigate('/hub');
      return;
    }

    // Try to handle the redirect manually
    const handleOAuthCallback = async () => {
      try {
        console.log('[SSO Callback] Attempting to handle OAuth callback...');
        
        // Check if there's an active session
        if (clerk.session) {
          console.log('[SSO Callback] Active session found, redirecting to /hub');
          navigate('/hub');
          return;
        }

        // If no session, wait a bit and check again (OAuth might still be processing)
        setTimeout(() => {
          if (clerk.session || isSignedIn) {
            console.log('[SSO Callback] Session now active, redirecting to /hub');
            navigate('/hub');
          } else {
            console.log('[SSO Callback] No session after wait, redirecting to /login');
            navigate('/login');
          }
          setProcessing(false);
        }, 2000);

      } catch (err: any) {
        console.error('[SSO Callback] Error handling OAuth:', err);
        setError(err?.message || 'Failed to complete sign in');
        setProcessing(false);
      }
    };

    handleOAuthCallback();
  }, [isLoaded, isSignedIn, user, clerk, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center">
        {error ? (
          <div className="max-w-md">
            <div className="text-red-600 mb-4">
              <svg className="h-12 w-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="font-semibold">Authentication Error</p>
            </div>
            <p className="text-gray-600 mb-4">{error}</p>
            <button 
              onClick={() => navigate('/login')} 
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Back to Login
            </button>
          </div>
        ) : processing ? (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Completing sign in...</p>
            <p className="text-xs text-gray-400 mt-2">Please wait...</p>
          </>
        ) : (
          <div>
            <p className="text-gray-600">Redirecting...</p>
          </div>
        )}
      </div>
    </div>
  );
}