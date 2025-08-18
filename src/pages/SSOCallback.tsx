import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClerk } from '@clerk/clerk-react';

export default function SSOCallback() {
  const navigate = useNavigate();
  const clerk = useClerk();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log('[SSO] Processing OAuth callback...');
        
        // Let Clerk handle the OAuth callback
        const { createdSessionId } = await clerk.handleRedirectCallback();
        
        if (createdSessionId) {
          console.log('[SSO] Session created successfully');
          // Set the session as active
          await clerk.setActive({ session: createdSessionId });
          // Navigate to hub
          navigate('/hub');
        } else {
          console.log('[SSO] No session created, checking current session');
          // Check if user is already signed in
          if (clerk.session) {
            console.log('[SSO] User already signed in');
            navigate('/hub');
          } else {
            console.log('[SSO] No active session, redirecting to login');
            navigate('/login');
          }
        }
      } catch (error: any) {
        console.error('[SSO] Callback error:', error);
        
        // Check for specific errors
        if (error.errors?.[0]?.code === 'session_exists') {
          // User is already logged in
          console.log('[SSO] Session already exists, redirecting to hub');
          navigate('/hub');
        } else if (error.errors?.[0]?.code === 'invalid_request_url') {
          // This might happen if the callback URL is accessed directly
          console.log('[SSO] Invalid callback request, checking session');
          if (clerk.session) {
            navigate('/hub');
          } else {
            navigate('/login');
          }
        } else {
          // Other errors, redirect to login
          navigate('/login');
        }
      }
    };

    // Add a small delay to ensure Clerk is fully loaded
    const timer = setTimeout(handleCallback, 100);
    return () => clearTimeout(timer);
  }, [clerk, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Completing sign in...</p>
      </div>
    </div>
  );
}