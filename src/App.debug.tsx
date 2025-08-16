import { useState, useEffect } from 'react';
import { useAuth } from './contexts/AuthContext';
import AuthForm from './components/AuthForm';

function AppDebug() {
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  
  const addDebug = (message: string) => {
    console.log(`[DEBUG] ${message}`);
    setDebugInfo(prev => [...prev, `${new Date().toISOString()}: ${message}`]);
  };

  let authContext;
  try {
    authContext = useAuth();
    // Don't call addDebug here - it causes re-renders during render
  } catch (error) {
    console.error('Error loading auth context:', error);
    return (
      <div className="p-4">
        <h1 className="text-red-600">Auth Context Error</h1>
        <pre>{String(error)}</pre>
      </div>
    );
  }

  const { user, login, signup, isLoading, logout } = authContext;

  useEffect(() => {
    addDebug('AppDebug component mounted');
  }, []);

  // Log auth state changes in useEffect to avoid render-time state updates
  useEffect(() => {
    addDebug(`Auth state changed: user=${user ? 'exists' : 'null'}, isLoading=${isLoading}`);
    if (user) {
      addDebug(`User details: ${user.email}, ${user.name}`);
    }
  }, [user, isLoading]);

  const handleLogin = async (email: string, password: string) => {
    addDebug(`Attempting login with email: ${email}`);
    try {
      const result = await login(email, password);
      addDebug(`Login result: ${result}`);
      return result;
    } catch (error) {
      addDebug(`Login error: ${error}`);
      return false;
    }
  };

  const handleSignup = async (email: string, password: string, name: string) => {
    addDebug(`Attempting signup with email: ${email}, name: ${name}`);
    try {
      const result = await signup(email, password, name);
      addDebug(`Signup result: ${result}`);
      return result;
    } catch (error) {
      addDebug(`Signup error: ${error}`);
      return false;
    }
  };

  if (isLoading) {
    return (
      <div className="p-4">
        <h1>Loading...</h1>
        <div className="mt-4 p-4 bg-gray-100 rounded">
          <h2 className="font-bold">Debug Log:</h2>
          <pre className="text-xs">{debugInfo.join('\n')}</pre>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div>
        <AuthForm onLogin={handleLogin} onSignup={handleSignup} onPasswordReset={async () => false} />
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-black text-white text-xs max-h-48 overflow-y-auto">
          <h3 className="font-bold mb-2">Debug Console:</h3>
          <pre>{debugInfo.join('\n')}</pre>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">User Logged In Successfully!</h1>
      <div className="mb-4 p-4 bg-green-100 rounded">
        <p>Email: {user.email}</p>
        <p>Name: {user.name}</p>
        <p>ID: {user.id}</p>
      </div>
      <button 
        onClick={() => {
          addDebug('Logout clicked');
          logout();
        }}
        className="px-4 py-2 bg-red-500 text-white rounded"
      >
        Logout
      </button>
      <div className="mt-4 p-4 bg-gray-100 rounded">
        <h2 className="font-bold">Debug Log:</h2>
        <pre className="text-xs">{debugInfo.join('\n')}</pre>
      </div>
    </div>
  );
}

export default AppDebug;