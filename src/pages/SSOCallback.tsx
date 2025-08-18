import { useEffect, useState } from 'react';
import { AuthenticateWithRedirectCallback } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';

export default function SSOCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string>('');
  
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
    }
  }, []);

  const handleError = (error: any) => {
    console.error('[SSO Callback] Authentication error:', error);
    setError(error?.errors?.[0]?.message || 'Authentication failed');
  };

  return (
    <div>
      <AuthenticateWithRedirectCallback 
        signInUrl="/login"
        signUpUrl="/signup"
        afterSignInUrl="/hub"
        afterSignUpUrl="/hub"
        redirectUrl="/hub"
        signInFallbackRedirectUrl="/login"
        signUpFallbackRedirectUrl="/signup"
      />
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
          ) : (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Completing sign in...</p>
              <p className="text-xs text-gray-400 mt-2">
                If you're not redirected, <button onClick={() => navigate('/hub')} className="underline">click here</button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}