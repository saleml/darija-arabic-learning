import { useEffect } from 'react';
import { AuthenticateWithRedirectCallback } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';

export default function SSOCallback() {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Log the current URL for debugging
    console.log('[SSO Callback] Current URL:', window.location.href);
    console.log('[SSO Callback] Search params:', window.location.search);
    console.log('[SSO Callback] Hash:', window.location.hash);
  }, []);

  return (
    <div>
      <AuthenticateWithRedirectCallback 
        signInUrl="/login"
        signUpUrl="/signup"
        afterSignInUrl="/hub"
        afterSignUpUrl="/hub"
        redirectUrl="/hub"
      />
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Completing sign in...</p>
          <p className="text-xs text-gray-400 mt-2">If you're not redirected, <button onClick={() => navigate('/hub')} className="underline">click here</button></p>
        </div>
      </div>
    </div>
  );
}